const { spring: spSpring, tween: spTween, easing: spEasing, styler: spStyler } = popmotion;

class SplitSlider {
    rootNode;
    currentSlideIndex;
    slides = [];
    pieces = [];

    constructor(rootNode, options={}) {
        if (!rootNode instanceof HTMLElement) throw new Error('supply html element');
        else {
            this.rootNode = rootNode;
            this.currentSlideIndex = options?.initialSlide || 0;
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
        const event = new CustomEvent(evt, data);
        element.dispatchEvent(event);
    }

    init() {
        const images = [...this.rootNode.querySelectorAll('img')];
        this.slides = images.map(i => i.parentNode.removeChild(i));
        this.pieces = this.slides.map(this.toCanvas.bind(this));
        this.setSliderHeight();
        window.addEventListener('resize', this.setSliderHeight.bind(this));
        console.log(this.pieces)
    }

    setSliderHeight() {
        this.rootNode.style.height = `${this.pieces[this.currentSlideIndex][0].height}px`;
    }

    dispose() {
        this.currentSlideIndex = this.clamp(this.currentSlideIndex, this.slides.length - 1, 0);
        this.pieces.forEach(p => {
            this.rootNode.appendChild(p[0]);
            this.rootNode.appendChild(p[1]);
        });
        const leftPieces = this.pieces.map(p => p[0]);
        const rightPieces = this.pieces.map(p => p[1]);
        
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