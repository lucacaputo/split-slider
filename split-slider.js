const { spring: spSpring, tween: spTween, easing: spEasing, styler: spStyler } = popmotion;

const events = {
    INIT: 'sp-init',
    TRANSITION_END: 'sp-transition-complete',
}

class SplitSlider {
    rootNode;
    currentSlideIndex;
    slides = [];
    pieces = [];
    styledPieces = [];
    captions;
    dotRootNode;
    captionsRootNode;

    constructor(rootNode, options={}) {
        if (!rootNode instanceof HTMLElement) throw new Error('supply html element');
        else {
            this.rootNode = rootNode;
            this.currentSlideIndex = options.initialSlide || 0;
            this.captions = options.captions || [];
            this.rootNode.classList.add('sp-slider');
            this.init();
        }
    }

    clamp = (num, hi, lo) => {
        if (num > hi) return hi;
        if (num < lo) return lo;
        return num;
    }

    triggerEvent = (evt, element, data=null) => {
        if (!element instanceof HTMLElement) throw new Error('Event must be dispatched by html elements');
        if (typeof evt !== 'string') throw new Error('Event name must be a string');
        const event = new CustomEvent(evt, {
            detail: data,
        });
        element.dispatchEvent(event);
    }

    init() {
        const images = [...this.rootNode.querySelectorAll('img')];
        this.slides = images.map(i => i.parentNode.removeChild(i));
        this.pieces = this.slides.map(this.toCanvas.bind(this));
        this.createDots();
        this.createCaptionContanier();
        this.setSliderHeight();
        this.disposeCaptions();
        window.addEventListener('resize', this.setSliderHeight.bind(this));
        window.addEventListener('resize', this.dispose.bind(this));
        this.styledPieces = this.pieces.map(s => [spStyler(s[0]), spStyler(s[1])]);
        this.dispose(true)
            .then(() => this.triggerEvent(events.INIT, this.rootNode))
            .catch(err => console.log(err));
    }

    createDots() {
        const dotWrapper = document.createElement('div');
        dotWrapper.className = 'sp-dot-wrapper';
        for(let i = 0; i < this.slides.length; i++) {
            const dot = document.createElement('button');
            dot.type = 'button';
            dot.className = 'sp-dot';
            const innerSpan = document.createElement('span');
            dot.appendChild(innerSpan);
            if (this.currentSlideIndex === i) {
                dot.classList.add('sp-dot-active');
            }
            dot.addEventListener('click', this.moveToSlide.bind(this, i));
            dotWrapper.appendChild(dot);
        }
        this.dotRootNode = dotWrapper;
        this.rootNode.appendChild(this.dotRootNode);
    }

    createCaptionContanier() {
        const container = document.createElement('div');
        container.className = 'sp-captions-container';
        const spans = this.slides.map((_, i) => {
            const span = document.createElement('span');
            span.className = 'sp-caption';
            span.innerHTML = `<p>${this.captions[i] || ''}</p>`;
            span.style.height = `calc(100% / ${this.captions.length})`;
            return span;
        });
        const spansWrapper = document.createElement('div');
        spansWrapper.className = 'sp-captions-inner-wrapper';
        spans.forEach(s => spansWrapper.appendChild(s));
        this.captionsRootNode = spansWrapper;
        container.appendChild(this.captionsRootNode);
        this.rootNode.appendChild(container);
    }

    disposeCaptions() {
        const sCapts = spStyler(this.captionsRootNode);
        const cpH = this.captionsRootNode.firstElementChild.clientHeight || 0;
        spSpring({
            from: { y: sCapts.get('y') },
            to: { y: -cpH*this.currentSlideIndex },
            stiffness: 280,
            damping: 35,
        }).start(sCapts.set);
    }

    moveToSlide(idx) {
        this.currentSlideIndex = this.clamp(idx, this.slides.length - 1, 0);
        const dots = [...this.dotRootNode.querySelectorAll('.sp-dot')];
        dots.forEach(d => d.classList.remove('sp-dot-active'));
        dots[this.currentSlideIndex].classList.add('sp-dot-active');
        this.dispose();
        this.disposeCaptions();
    }

    setSliderHeight() {
        this.rootNode.style.height = `${this.pieces[this.currentSlideIndex][0].height}px`;
        const ch = this.captionsRootNode.parentElement.clientHeight || 0;
        this.captionsRootNode.style.height = `${ch*this.captions.length}px`;
    }

    dispose(init=false) {
        init && this.pieces.forEach(p => {
            this.rootNode.appendChild(p[0]);
            this.rootNode.appendChild(p[1]);
        });
        const leftPieces = this.styledPieces.map(p => p[0]);
        const rightPieces = this.styledPieces.map(p => p[1]);
        return new Promise((res, rej) => {
            for (let j = 0; j < this.pieces.length; j++) {
                let lpTwo = leftPieces[j];
                let rpTwo = rightPieces[j];
                if (!lpTwo || !rpTwo) rej(new Error('piece of slide is undefined'));
                const offTwo = j - this.currentSlideIndex;
                spSpring({
                    from: [
                        lpTwo.get('y'), 
                        rpTwo.get('y'),
                    ],
                    to: [
                        -offTwo*lpTwo.get('height'),
                        offTwo*rpTwo.get('height'),
                    ],
                    stiffness: 195,
                    damping: 30,
                }).start({
                    update: v => {
                        lpTwo.set('y', v[0]);
                        rpTwo.set('y', v[1]);
                    },
                    complete: () => {
                        if (j === this.pieces.length - 1) {
                            this.triggerEvent(events.TRANSITION_END, this.rootNode, this);
                            res();
                        }
                    }
                })
            }
        });
    }

    setCanvasDimensions(canvas, w, h) {
        canvas.width = w;
        canvas.height = h;
    }

    createCanvas = () => {
        const canvas = document.createElement('canvas');
        return canvas;
    }

    drawSlide(cnvLeft, cnvRight, img) {
        const ctxLeft = cnvLeft.getContext('2d'),
              ctxRight = cnvRight.getContext('2d');
        const aspectRatio = (img.width / 2) / img.height;
        this.setCanvasDimensions(cnvLeft, Math.ceil(this.rootNode.clientWidth / 2), Math.ceil((this.rootNode.clientWidth / 2) / aspectRatio));
        this.setCanvasDimensions(cnvRight, Math.ceil(this.rootNode.clientWidth / 2), Math.ceil((this.rootNode.clientWidth / 2) / aspectRatio));
        ctxLeft.clearRect(0, 0, cnvLeft.width, cnvLeft.height);
        ctxRight.clearRect(0, 0, cnvRight.width, cnvRight.height);
        ctxLeft.drawImage(
            img,
            0,
            0,
            img.width / 2,
            img.height,
            0,
            0,
            cnvLeft.width,
            cnvLeft.height,
        );
        ctxRight.drawImage(
            img,
            img.width / 2,
            0,
            img.width / 2,
            img.height,
            0,
            0,
            cnvRight.width,
            cnvRight.height,
        )
    }

    toCanvas(img) {
        if (img instanceof HTMLImageElement) {
            const cnvLeft = this.createCanvas(),
                  cnvRight = this.createCanvas();
            this.drawSlide(cnvLeft, cnvRight, img);
            cnvLeft.className = 'sp-canvas-left sp-canvas-piece';
            cnvRight.className = 'sp-canvas-right sp-canvas-piece';
            window.addEventListener('resize', this.drawSlide.bind(this, cnvLeft, cnvRight, img));
            return [cnvLeft, cnvRight];
        } else throw new Error('Arg 1 must be an html img tag');
    }

}