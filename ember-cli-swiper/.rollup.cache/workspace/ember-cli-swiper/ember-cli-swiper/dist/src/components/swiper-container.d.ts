import Component from '@glimmer/component';
import { NavigationOptions } from 'swiper/types/modules/navigation';
import { PaginationOptions } from 'swiper/types/modules/pagination';
interface Options {
    navigation: boolean | NavigationOptions;
    pagination: boolean | PaginationOptions;
    vertical: boolean;
    centered: boolean;
    centeredSlides: boolean;
}
interface Arguments {
    options: Options;
    navigation: boolean;
    pagination: boolean;
}
export default class SwiperContainer extends Component<Arguments> {
    /**
     * Swiper Instance
     */
    private swiper?;
    /**
     * Proxies `Swiper.activeIndex`
     */
    currentSlide: number;
    /**
     * Compared against `currentSlide`
     */
    private currentSlideInternal;
    /**
     * User defined map of Swiper events
     * @type {Object}
     */
    events: any;
    /**
     * Abstraction to invoke `Swiper.update`
     */
    updateFor: string;
    /**
     * Compared against `updateFor`
     */
    private updateForInternal;
    /**
     * Render navigation controls
     */
    get hasNavigation(): boolean;
    /**
     * Swiper next element class
     */
    nextElClass: string;
    /**
     * Swiper previous element class
     */
    prevElClass: string;
    /**
     * Render pagination controls
     */
    get hasPagination(): boolean;
    /**
     * Single Attribute options
     */
    options: Options | null;
    /**
     * Get Swiper options from attributes
     */
    private getOptions;
    /**
     * Userland fallback sugar for forcing swiper update
     * @public
     */
    forceUpdate(): void;
    /**
     * Update `currentSlide` and trigger `onChange` event
     * @private
     * @param {Object} swiper - Swiper instance
     */
    private slideChanged;
    didUpdateAttrs(): void;
    didInsertElement(): void;
    willDestroyElement(): void;
    /**
     * On Swiper Slide change
     * @public
     * @param {Swiper.Slide} swiperSlide
     */
    onChange(): void;
}
export {};
