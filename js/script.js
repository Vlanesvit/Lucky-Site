// Табы
function tabs() {
	const tabs = document.querySelectorAll('[data-tabs]');
	let tabsActiveHash = [];

	// Получаем хэш из URL
	const hash = getHash();
	if (hash && hash.startsWith('tab-')) {
		tabsActiveHash = hash.replace('tab-', '').split('-');
	}

	if (tabs.length > 0) {
		resetTabs();

		tabs.forEach((tabsBlock, index) => {
			tabsBlock.classList.add('_tab-init');
			tabsBlock.setAttribute('data-tabs-index', index);
			tabsBlock.addEventListener("click", setTabsAction);
			initTabs(tabsBlock);
		});
	}

	// Инициализация медиа-запросов
	let mdQueriesArray = dataMediaQueries(tabs, "tabs");
	if (mdQueriesArray && mdQueriesArray.length) {
		mdQueriesArray.forEach(mdQueriesItem => {
			mdQueriesItem.matchMedia.addEventListener("change", () => {
				setTitlePosition(mdQueriesItem.itemsArray, mdQueriesItem.matchMedia);
			});
			setTitlePosition(mdQueriesItem.itemsArray, mdQueriesItem.matchMedia);
		});
	}

	// Сброс вкладок
	function resetTabs() {
		document.querySelectorAll('._tab-active').forEach(el => el.classList.remove('_tab-active'));
	}

	// Инициализация табов
	function initTabs(tabsBlock) {
		const tabsTitles = tabsBlock.querySelectorAll('[data-tabs-titles]>*');
		const tabsContent = tabsBlock.querySelectorAll('[data-tabs-body]>*');
		const tabsBlockIndex = tabsBlock.dataset.tabsIndex;
		const tabsActiveHashBlock = tabsActiveHash[0] == tabsBlockIndex;

		if (tabsTitles.length > 0 && tabsContent.length > 0) {
			tabsContent.forEach((content, index) => {
				if (tabsTitles[index]) {
					tabsTitles[index].setAttribute('data-tabs-title', '');
					content.setAttribute('data-tabs-item', '');

					// Если хэш блока не совпадает, добавляем активный класс
					if (!tabsActiveHashBlock && index === 0) {
						tabsTitles[index].classList.add('_tab-active');
						content.classList.add('_tab-active');
					}

					if (tabsActiveHashBlock && index == tabsActiveHash[1]) {
						tabsTitles[index].classList.add('_tab-active');
						content.classList.add('_tab-active');
					}
				}
			});
		}
	}

	// Расстановка заголовков по медиа-запросам
	function setTitlePosition(tabsMediaArray, matchMedia) {
		tabsMediaArray.forEach(tabsMediaItem => {
			const tabsTitles = tabsMediaItem.item.querySelector('[data-tabs-titles]');
			const tabsContent = tabsMediaItem.item.querySelector('[data-tabs-body]');
			const tabTitles = Array.from(tabsMediaItem.item.querySelectorAll('[data-tabs-title]'));
			const tabItems = Array.from(tabsMediaItem.item.querySelectorAll('[data-tabs-item]'));

			if (matchMedia.matches) {
				tabItems.forEach((content, index) => {
					tabsContent.append(tabTitles[index]);
					tabsContent.append(content);
					tabsMediaItem.item.classList.add('_tab-spoller');
				});
			} else {
				tabTitles.forEach((title, index) => {
					tabsTitles.append(title);
					tabsMediaItem.item.classList.remove('_tab-spoller');
				});
			}
		});
	}

	// Обновление состояния табов
	function setTabsStatus(tabsBlock) {
		const tabsTitles = tabsBlock.querySelectorAll('[data-tabs-title]');
		const tabsContent = tabsBlock.querySelectorAll('[data-tabs-item]');
		// const tabsBlockIndex = tabsBlock.dataset.tabsIndex;

		tabsContent.forEach((content, index) => {
			if (tabsTitles[index].classList.contains('_tab-active')) {
				content.classList.add('_tab-active');
				// setHash(`tab-${tabsBlockIndex}-${index}`);
			} else {
				tabsTitles[index].classList.remove('_tab-active')
				content.classList.remove('_tab-active');
			}
		});
	}

	// Обработка кликов по заголовкам табов
	function setTabsAction(e) {
		const tabTitle = e.target.closest('[data-tabs-title]');
		if (tabTitle) {
			const tabsBlock = tabTitle.closest('[data-tabs]');
			if (!tabTitle.classList.contains('_tab-active') && !tabsBlock.querySelector('._slide')) {
				tabsBlock.querySelectorAll('[data-tabs-title]._tab-active').forEach(item => item.classList.remove('_tab-active'));
				tabTitle.classList.add('_tab-active');
				setTabsStatus(tabsBlock);
			}
			e.preventDefault();
		}
	}
}
tabs()

// Слайдер
class Slider {
	constructor(selector, options) {
		// Устанавливаем настройки по умолчанию
		const defaultOptions = {
			slidesPerView: 1,
			spaceBetween: 0,
			autoplay: {
				enabled: false,
				autoplayDelay: 4000
			},
			loop: false,
			pagination: {
				enabled: true,
				type: 'bullet'
			},
			breakpoints: {}
		};

		this.options = { ...defaultOptions, ...options };
		this.slider = typeof selector === 'string' ? document.querySelector(selector) : selector;
		this.isInitialized = false;

		if (this.slider) {
			this.sliderWrapper = this.slider.querySelector('.slider-wrapper');
			this.slides = this.sliderWrapper.querySelectorAll('.slide');
			this.prevButton = this.slider.querySelector('.slider-arrow-prev');
			this.nextButton = this.slider.querySelector('.slider-arrow-next');
			this.pagination = this.slider.querySelector('.slider-pagination');

			this.currentIndex = 0;
			this.autoplayTimer = null;

			// Флаги и координаты для drag-событий
			this.isDragging = false;
			this.startX = 0;
			this.currentTranslate = 0;
			this.prevTranslate = 0;

			this.handleResize = this.handleResize.bind(this);
			this.applyBreakpointSettings(); // сразу применяем настройки по брейкпоинтам

			window.addEventListener('resize', this.handleResize);
		}
	}

	// Метод для инициализации слайдера
	init() {
		if (this.isInitialized) return;
		this.isInitialized = true;

		this.slider.classList.add('slider-init');

		this.updateSlider();
		this.updatePagination();
		this.updateFraction();
		this.updateButtonState();

		this.prevButton?.addEventListener('click', this.prevSlideBound = this.prevSlide.bind(this));
		this.nextButton?.addEventListener('click', this.nextSlideBound = this.nextSlide.bind(this));

		this.initDragEvents();

		if (this.options.autoplay.enabled) {
			this.startAutoplay();
			this.slider.addEventListener('mouseenter', this.stopAutoplayBound = this.stopAutoplay.bind(this));
			this.slider.addEventListener('mouseleave', this.startAutoplayBound = this.startAutoplay.bind(this));
		}
	}

	// Устанавливаем актуальные настройки по брейкпоинтам
	applyBreakpointSettings() {
		const breakpoints = this.options.breakpoints;
		const windowWidth = window.innerWidth;

		let activeBreakpoint = null;
		for (let point in breakpoints) {
			if (windowWidth >= +point) {
				activeBreakpoint = breakpoints[point];
			}
		}

		// Если в брейкпоинте указано destroy, отключаем слайдер
		if (activeBreakpoint?.destroy) {
			this.destroy();
		} else {
			// Применяем настройки из брейкпоинта (без перезаписи всех опций)
			Object.assign(this.options, activeBreakpoint || {});
			this.init();
		}
	}

	// Метод обновления ширины слайдов и позиционирования
	updateSlider() {
		const totalWidth = this.slider.clientWidth;
		const slideWidth = (totalWidth - (this.options.slidesPerView - 1) * this.options.spaceBetween) / this.options.slidesPerView;

		this.slides.forEach((slide, i) => {
			slide.style.width = `${slideWidth}px`;
			slide.style.marginRight = i < this.slides.length - 1 ? `${this.options.spaceBetween}px` : '0';
		});

		this.updateSliderPosition();
	}

	// Обновление позиции слайдов
	updateSliderPosition() {
		const offset = -this.currentIndex * (this.slides[0].offsetWidth + this.options.spaceBetween);
		this.sliderWrapper.style.transform = `translateX(${offset}px)`;
		this.sliderWrapper.style.transition = 'transform 0.3s ease';
	}

	// Следующий слайд
	nextSlide() {
		const totalPages = this.slides.length - this.options.slidesPerView + 1;
		if (this.currentIndex < totalPages - 1) {
			this.currentIndex++;
		} else if (this.options.loop) {
			this.currentIndex = 0;
		}
		this.updateSliderPosition();
		this.updatePagination();
		this.updateFraction();
		this.updateButtonState();
	}

	// Предыдущий слайд
	prevSlide() {
		const totalPages = this.slides.length - this.options.slidesPerView + 1;
		if (this.currentIndex > 0) {
			this.currentIndex--;
		} else if (this.options.loop) {
			this.currentIndex = totalPages - 1;
		}
		this.updateSliderPosition();
		this.updatePagination();
		this.updateFraction();
		this.updateButtonState();
	}

	// Запуск автопрокрутки
	startAutoplay() {
		this.autoplayTimer = setInterval(() => this.nextSlide(), this.options.autoplay.autoplayDelay);
	}

	// Остановка автопрокрутки
	stopAutoplay() {
		clearInterval(this.autoplayTimer);
	}

	// Обновление пагинации (точки)
	updatePagination() {
		if (!this.options.pagination.enabled || !this.pagination) return;

		this.pagination.innerHTML = '';
		const totalPages = Math.ceil(this.slides.length / this.options.slidesPerView);

		for (let i = 0; i < totalPages; i++) {
			const dot = document.createElement('span');
			dot.className = 'dot';
			if (i === Math.floor(this.currentIndex / this.options.slidesPerView)) {
				dot.classList.add('active');
			}
			dot.addEventListener('click', () => {
				this.currentIndex = i * this.options.slidesPerView;
				this.updateSliderPosition();
				this.updatePagination();
				this.updateFraction();
				this.updateButtonState();
			});
			this.pagination.appendChild(dot);
		}
		this.pagination.className = `slider-pagination slider-pagination-${this.options.pagination.type}`;
	}

	// Обновление пагинации (фракция)
	updateFraction() {
		if (!this.options.pagination.enabled || this.options.pagination.type !== 'fraction' || !this.pagination) return;

		const totalPages = this.slides.length - this.options.slidesPerView + 1;
		const currentPage = this.currentIndex + 1;

		this.pagination.innerHTML = `<span class="slider-pagination-fraction-count">${currentPage}</span> / ${totalPages}`;
	}

	// Активация/деактивация кнопок в зависимости от текущего слайда
	updateButtonState() {
		if (!this.options.loop) {
			this.prevButton?.classList.toggle('disable', this.currentIndex === 0);
			this.nextButton?.classList.toggle('disable', this.currentIndex >= this.slides.length - this.options.slidesPerView);
		}
	}

	// Добавление drag-событий (мышь и сенсор)
	initDragEvents() {
		const start = (clientX) => {
			this.isDragging = true;
			this.startX = clientX;
			this.prevTranslate = -this.currentIndex * (this.slides[0].offsetWidth + this.options.spaceBetween);
		};

		const move = (clientX) => {
			if (!this.isDragging) return;
			const delta = clientX - this.startX;
			this.currentTranslate = this.prevTranslate + delta;
			this.sliderWrapper.style.transition = 'none';
			this.sliderWrapper.style.transform = `translateX(${this.currentTranslate}px)`;
		};

		const end = () => {
			if (!this.isDragging) return;
			const movedBy = this.currentTranslate - this.prevTranslate;
			const threshold = this.slides[0].offsetWidth / 4;

			if (movedBy < -threshold) {
				this.nextSlide();
			} else if (movedBy > threshold) {
				this.prevSlide();
			} else {
				this.updateSliderPosition();
			}
			this.isDragging = false;
		};

		// Сохраняем ссылки на обработчики, чтобы удалить их при destroy
		this.dragHandlers = {
			mouseDown: e => start(e.clientX),
			mouseMove: e => move(e.clientX),
			mouseUp: end,
			mouseLeave: end,
			touchStart: e => start(e.touches[0].clientX),
			touchMove: e => move(e.touches[0].clientX),
			touchEnd: end,
		};

		this.sliderWrapper.addEventListener('mousedown', this.dragHandlers.mouseDown);
		this.sliderWrapper.addEventListener('mousemove', this.dragHandlers.mouseMove);
		this.sliderWrapper.addEventListener('mouseup', this.dragHandlers.mouseUp);
		this.sliderWrapper.addEventListener('mouseleave', this.dragHandlers.mouseLeave);
		this.sliderWrapper.addEventListener('touchstart', this.dragHandlers.touchStart);
		this.sliderWrapper.addEventListener('touchmove', this.dragHandlers.touchMove);
		this.sliderWrapper.addEventListener('touchend', this.dragHandlers.touchEnd);
	}

	// Уничтожение слайдера: удаляем стили, события и сбрасываем состояние
	destroy() {
		if (!this.isInitialized) return;
		this.isInitialized = false;

		this.slider.classList.remove('slider-init');
		this.sliderWrapper.style.transform = '';
		this.sliderWrapper.style.transition = '';
		this.slides.forEach(slide => slide.removeAttribute('style'));
		this.stopAutoplay();

		if (this.prevButton && this.prevSlideBound) {
			this.prevButton.removeEventListener('click', this.prevSlideBound);
		}
		if (this.nextButton && this.nextSlideBound) {
			this.nextButton.removeEventListener('click', this.nextSlideBound);
		}
		if (this.slider && this.stopAutoplayBound && this.startAutoplayBound) {
			this.slider.removeEventListener('mouseenter', this.stopAutoplayBound);
			this.slider.removeEventListener('mouseleave', this.startAutoplayBound);
		}
		if (this.dragHandlers) {
			this.sliderWrapper.removeEventListener('mousedown', this.dragHandlers.mouseDown);
			this.sliderWrapper.removeEventListener('mousemove', this.dragHandlers.mouseMove);
			this.sliderWrapper.removeEventListener('mouseup', this.dragHandlers.mouseUp);
			this.sliderWrapper.removeEventListener('mouseleave', this.dragHandlers.mouseLeave);
			this.sliderWrapper.removeEventListener('touchstart', this.dragHandlers.touchStart);
			this.sliderWrapper.removeEventListener('touchmove', this.dragHandlers.touchMove);
			this.sliderWrapper.removeEventListener('touchend', this.dragHandlers.touchEnd);
		}
		if (this.pagination) {
			this.pagination.innerHTML = '';
		}
	}

	// Обработка ресайза окна
	handleResize() {
		this.applyBreakpointSettings();
		if (this.isInitialized) {
			this.updateSlider();
			this.updatePagination();
			this.updateFraction();
			this.updateButtonState();
		}
	}
}
function initSliders() {
	// Инициализация слайдера
	document.querySelectorAll('.tabs__slider').forEach(sldr => {
		const slider = new Slider(sldr, {
			spaceBetween: 30,
			slidesPerView: 1,
			autoplay: {
				enabled: true,
				autoplayDelay: 4000
			},
			pagination: {
				enabled: true,
				type: 'bullet'
			},
		});
	});
}
window.addEventListener('load', function () {
	initSliders();
})

//========================================================================================================================================================
// Вспомогательный модуль
// Обработа медиа запросов из атрибутов 
function dataMediaQueries(array, dataSetValue) {
	// Получение объектов с медиа запросами
	const media = Array.from(array).filter(function (item, index, self) {
		if (item.dataset[dataSetValue]) {
			return item.dataset[dataSetValue].split(",")[0];
		}
	});
	// Инициализация объектов с медиа запросами
	if (media.length) {
		const breakpointsArray = [];
		media.forEach(item => {
			const params = item.dataset[dataSetValue];
			const breakpoint = {};
			const paramsArray = params.split(",");
			breakpoint.value = paramsArray[0];
			breakpoint.type = paramsArray[1] ? paramsArray[1].trim() : "max";
			breakpoint.item = item;
			breakpointsArray.push(breakpoint);
		});
		// Получаем уникальные брейкпоинты
		let mdQueries = breakpointsArray.map(function (item) {
			return '(' + item.type + "-width: " + item.value + "px)," + item.value + ',' + item.type;
		});
		mdQueries = uniqArray(mdQueries);
		const mdQueriesArray = [];

		if (mdQueries.length) {
			// Работаем с каждым брейкпоинтом
			mdQueries.forEach(breakpoint => {
				const paramsArray = breakpoint.split(",");
				const mediaBreakpoint = paramsArray[1];
				const mediaType = paramsArray[2];
				const matchMedia = window.matchMedia(paramsArray[0]);
				// Объекты с нужными условиями
				const itemsArray = breakpointsArray.filter(function (item) {
					if (item.value === mediaBreakpoint && item.type === mediaType) {
						return true;
					}
				});
				mdQueriesArray.push({
					itemsArray,
					matchMedia
				})
			});
			return mdQueriesArray;
		}
	}
}
// Уникализация массива
function uniqArray(array) {
	return array.filter(function (item, index, self) {
		return self.indexOf(item) === index;
	});
}
// Получение хеша в адресе сайта
function getHash() {
	if (location.hash) { return location.hash.replace('#', ''); }
}
// Указание хеша в адресе сайта
function setHash(hash) {
	hash = hash ? `#${hash}` : window.location.href.split('#')[0];
	history.pushState('', '', hash);
}
// Добавить картинкам draggable="false"
const imgs = document.getElementsByTagName('img');
for (let i = 0; i < imgs.length; i++) {
	imgs[i].setAttribute('draggable', false);
}

//========================================================================================================================================================
// Вспомогательные модули блокировки прокрутки
let bodyLockStatus = true;
let bodyLockToggle = (delay = 300) => {
	if (document.documentElement.classList.contains('lock')) {
		bodyUnlock(delay);
	} else {
		bodyLock(delay);
	}
}
let bodyUnlock = (delay = 300) => {
	let body = document.querySelector("body");
	if (bodyLockStatus) {
		let lock_padding = document.querySelectorAll("[data-lp]");
		setTimeout(() => {
			for (let index = 0; index < lock_padding.length; index++) {
				const el = lock_padding[index];
				el.style.paddingRight = '0px';
			}
			body.style.paddingRight = '0px';
			document.documentElement.classList.remove("lock");
		}, delay);
		bodyLockStatus = false;
		setTimeout(function () {
			bodyLockStatus = true;
		}, delay);
	}
}
let bodyLock = (delay = 300) => {
	let body = document.querySelector("body");
	if (bodyLockStatus) {
		let lock_padding = document.querySelectorAll("[data-lp]");
		for (let index = 0; index < lock_padding.length; index++) {
			const el = lock_padding[index];
			el.style.paddingRight = window.innerWidth - document.querySelector('.wrapper').offsetWidth + 'px';
		}
		body.style.paddingRight = window.innerWidth - document.querySelector('.wrapper').offsetWidth + 'px';
		document.documentElement.classList.add("lock");

		bodyLockStatus = false;
		setTimeout(function () {
			bodyLockStatus = true;
		}, delay);
	}
}

//========================================================================================================================================================
// Вспомогательные модули плавного раскрытия и закрытия объекта
let _slideUp = (target, duration = 500, showmore = 0) => {
	if (!target.classList.contains('_slide')) {
		target.classList.add('_slide');
		target.style.transitionProperty = 'height, margin, padding';
		target.style.transitionDuration = duration + 'ms';
		target.style.height = `${target.offsetHeight}px`;
		target.offsetHeight;
		target.style.overflow = 'hidden';
		target.style.height = showmore ? `${showmore}px` : `0px`;
		target.style.paddingTop = 0;
		target.style.paddingBottom = 0;
		target.style.marginTop = 0;
		target.style.marginBottom = 0;
		window.setTimeout(() => {
			target.hidden = !showmore ? true : false;
			!showmore ? target.style.removeProperty('height') : null;
			target.style.removeProperty('padding-top');
			target.style.removeProperty('padding-bottom');
			target.style.removeProperty('margin-top');
			target.style.removeProperty('margin-bottom');
			!showmore ? target.style.removeProperty('overflow') : null;
			target.style.removeProperty('transition-duration');
			target.style.removeProperty('transition-property');
			target.classList.remove('_slide');
		}, duration);
	}
}
let _slideDown = (target, duration = 500, showmore = 0) => {
	if (!target.classList.contains('_slide')) {
		target.classList.add('_slide');
		target.hidden = target.hidden ? false : null;
		showmore ? target.style.removeProperty('height') : null;
		let height = target.offsetHeight;
		target.style.overflow = 'hidden';
		target.style.height = showmore ? `${showmore}px` : `0px`;
		target.style.paddingTop = 0;
		target.style.paddingBottom = 0;
		target.style.marginTop = 0;
		target.style.marginBottom = 0;
		target.offsetHeight;
		target.style.transitionProperty = "height, margin, padding";
		target.style.transitionDuration = duration + 'ms';
		target.style.height = height + 'px';
		target.style.removeProperty('padding-top');
		target.style.removeProperty('padding-bottom');
		target.style.removeProperty('margin-top');
		target.style.removeProperty('margin-bottom');
		window.setTimeout(() => {
			target.style.removeProperty('height');
			target.style.removeProperty('overflow');
			target.style.removeProperty('transition-duration');
			target.style.removeProperty('transition-property');
			target.classList.remove('_slide');
		}, duration);
	}
}
let _slideToggle = (target, duration = 500) => {
	if (target.hidden) {
		return _slideDown(target, duration);
	} else {
		return _slideUp(target, duration);
	}
}
