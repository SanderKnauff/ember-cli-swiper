import Swiper from 'swiper';
import Component from '@glimmer/component';
import { getProperties } from '@ember/object';
import { once } from '@ember/runloop';
import { warn } from '@ember/debug';
import { NavigationOptions } from 'swiper/types/modules/navigation';
import { PaginationOptions } from 'swiper/types/modules/pagination';
import { SwiperEvents } from 'swiper/types/swiper-events';
import SwiperSlide from './swiper-slide';

interface Options {
  navigation: boolean | NavigationOptions;
  pagination: boolean | PaginationOptions;
  vertical: boolean;
  centered: boolean;
  centeredSlides: boolean;
  init: boolean;
}

interface Arguments {
  options: Options;
  navigation: boolean;
  pagination: boolean;
  loop: boolean;
  events: Events;
}

type Events = {
  [key in keyof SwiperEvents]: any;
}

const EMBER_CLI_SWIPER_OPTIONS = [
  'options',
  'registerAs',
  'vertical',
  'centered',
  'updateFor',
  'currentSlide'
] as const;

export default class SwiperContainer extends Component<Arguments> {
  /**
   * Swiper Instance
   */
  private swiper: Swiper | null = null;

  /**
   * Proxies `Swiper.activeIndex`
   */
  public currentSlide: number = 0;

  /**
   * Compared against `currentSlide`
   */
  private currentSlideInternal: number = 0;

  /**
   * Abstraction to invoke `Swiper.update`
   */
  public updateFor: string = '';

  /**
   * Compared against `updateFor`
   */
  private updateForInternal: string = '';

  /**
   * Render navigation controls
   */
  public get hasNavigation(): boolean {
     return !!this.options?.navigation ?? this.args.navigation;
  }

  /**
   * Swiper next element class
   */
  public nextElClass: string = 'swiper-button-next';

  /**
   * Swiper previous element class
   */
  public prevElClass: string = 'swiper-button-prev';

  /**
   * Render pagination controls
   */
  public get hasPagination(): boolean {
    return !!this.args.options.pagination ?? this.args.pagination;
  }

  /**
   * Single Attribute options
   */
  public options: Options | null  = null;

  /**
   * Get Swiper options from attributes
   */
  private getOptions() {
    let attrs = getProperties(this,  [...Object.keys(this.attrs)]); // eslint-disable-line ember/no-attrs-in-components
    let options = Object.assign({}, this.options, attrs);

    // Overwrite pagination element selector
    if (options.pagination) {
      let customPaginationEl
        = (typeof options.pagination === 'string' && options.pagination) // custom string selector
        || (typeof options.pagination === 'object' && options.pagination.el) // custom `el` option selector
        || '';

      // Note:
      //  Never resolve user provided pagination configuration,
      //  which may not extend Object.prototype creating hard to
      //  debug issues within Swiper.
      options.pagination = Object.assign(
        { clickable: customPaginationEl ? true : false }, // custom paginations must be clickable
        typeof options.pagination === 'object' ? options.pagination : {},
        {
          el: customPaginationEl || `#${this.elementId} > .swiper-pagination`
        }
      );
    }

    if (options.navigation) {
      if (typeof options.navigation !== 'object') {
        options.navigation = {};
      }

      // Sync prev/next nav classes to custom options
      if (typeof options.navigation.prevEl === 'string') {
        this.prevElClass = options.navigation.prevEl.replace('.', '');
      }

      if (typeof options.navigation.nextEl === 'string') {
        this.nextElClass = options.navigation.nextEl.replace('.', '');
      }

      // Ensure `nextEl` & `prevEl` required options set
      // and that navigation inherits from Object.prototype
      options.navigation = Object.assign({}, options.navigation, {
        nextEl: `.${this.nextElClass}`,
        prevEl: `.${this.prevElClass}`
      });
    }

    if (options.vertical) {
      warn(
        'ember-cli-swiper option `direction` is ignored while `vertical` true',
        !options.direction,
        { id: 'ember-cli-swiper.direction-with-virtical' }
      );

      options.direction = 'vertical';
    }

    if (options.centered) {
      warn(
        'ember-cli-swiper option `centeredSlides` is ignored while `centered` true',
        !options.centeredSlides,
        { id: 'ember-cli-swiper.centered-with-centered-slides' }
      );

      options.centeredSlides = true;
    }

    // Allows `init` event to fire
    if (this.args.events.init) {
      options.init = false;
    }

    /*
     Remove component-only
     configuration options from Swiper options
     */
    Object.keys(options).forEach(
      (k) => EMBER_CLI_SWIPER_OPTIONS.indexOf(k) !== -1 && delete options[k]
    );

    return options;
  }

  /**
   * Userland fallback sugar for forcing swiper update
   * @public
   */
  forceUpdate() {
    if (!this.swiper) {
      return;
    }

    this.swiper.update();
    this.swiper.slideTo(this.currentSlide);
  }

  /**
   * Update `currentSlide` and trigger `onChange` event
   * @private
   * @param {Object} swiper - Swiper instance
   */
  private slideChanged(swiper: Swiper) {
    let index;

    if (this.loop) {
      index = parseInt(
        swiper.slides
          .parent()
          .find('.swiper-slide-active')
          .attr('data-swiper-slide-index'),
        10
      );
    } else {
      index = swiper.realIndex;
    }

    this.currentSlideInternal = index;
    this.currentSlide = index;
    this.onChange = swiper.slides[swiper.realIndex];
  }

  didUpdateAttrs() {
    if (!this.swiper) {
      return;
    }

    /*
     Data-down Swiper slide activation
     */
    if (this.currentSlide !== this.currentSlideInternal) {
      let index = this.currentSlide;

      if (this.args.loop) {
        index = this.swiper.slides
          .parent()
          .find(`[data-swiper-slide-index="${this.currentSlide}"]`)
          .prevAll().length;
      }

      this.swiper.slideTo(index);
      this.currentSlideInternal = this.currentSlide;
    }

    /*
     Trigger `update()` of swiper
     */
    if (this.updateFor !== this.updateForInternal) {
      once(this.swiper, this.swiper.update);
      this.updateForInternal = this.updateFor;
    }
  }

  didInsertElement() {
    //TODO replace with modifier
    super.didInsertElement();
    this.registerAs = this;

    let swiperOptions = Object.assign(
      { initialSlide: this.currentSlide },
      this.getOptions()
    );

    let transitionEvent: keyof SwiperEvents = this.args.loop ? 'slideChangeTransitionEnd' : 'slideChange';
    let instance = this.swiper = new Swiper(this.element, swiperOptions);
    instance.on(
      transitionEvent,
      this.slideChanged.bind(this, instance)
    );

    // Subscribe configured actions as Swiper events
    (Object.keys(this.args.events || {}) as unknown as (keyof SwiperEvents)[]).forEach((evt) =>
      instance.on(evt, this.events[evt])
    );

    // Manual initalization when user requires `init` event handling
    if (swiperOptions.init === false) {
      instance.init();
    }
  }

  willDestroyElement() {
    super.willDestroy();

    if (this.swiper) {
      this.swiper.off('slideChangeTransitionEnd');
      this.swiper.destroy();
      this.swiper = null;
    }
  }

  /**
   * On Swiper Slide change
   */
  public onChange(_swiperSlide: SwiperSlide) {}
}
