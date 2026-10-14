
class ImageSlider {
  constructor(root, options = {}) {
    if (!root) {
      throw new Error("Slider root element is required.");
    }

    this.root = root;
    this.track = root.querySelector("#sliderTrack");
    this.prevButton = root.querySelector("#prevButton");
    this.nextButton = root.querySelector("#nextButton");
    this.dotsContainer = root.querySelector("#sliderDots");
    this.status = root.querySelector("#sliderStatus");

    this.slides = Array.from(
      this.track?.querySelectorAll(".slide") ?? []
    );

    this.duration = options.duration ?? 520;
    this.index = 0;
    this.position = 1;
    this.isAnimating = false;
    this.queue = [];
    this.destroyed = false;

    if (!this.track || this.slides.length === 0) {
      throw new Error("Slider requires a track and at least one slide.");
    }

    // Save callback references so destroy() can remove them.
    this.handleNext = () => this.navigate("next");
    this.handlePrevious = () => this.navigate("previous");
    this.handleKeydown = (event) => {
      if (event.key === "ArrowRight") {
        event.preventDefault();
        this.navigate("next");
      }

      if (event.key === "ArrowLeft") {
        event.preventDefault();
        this.navigate("previous");
      }
    };

    this.handleTransitionEnd = (event) => {
      if (
        event.target !== this.track ||
        event.propertyName !== "transform"
      ) {
        return;
      }

      this.finishAnimation();
    };

    this.handleDotClick = (event) => {
      const dot = event.target.closest(".slider__dot");

      if (!dot || !this.dotsContainer.contains(dot)) return;

      const targetIndex = Number(dot.dataset.index);

      if (Number.isInteger(targetIndex)) {
        this.goTo(targetIndex);
      }
    };

    this.buildInfiniteTrack();
    this.buildDots();
    this.bindEvents();
    this.updateUI();

    this.track.style.transition = "none";
    this.setPosition(1);
    void this.track.offsetWidth;
    this.track.style.transition =
      `transform ${this.duration}ms cubic-bezier(0.22, 0.75, 0.25, 1)`;

    this.setupResizeObserver();
  }

  // Add clones at both boundaries.
  buildInfiniteTrack() {
    this.firstClone = this.slides[0].cloneNode(true);
    this.lastClone = this.slides[this.slides.length - 1].cloneNode(true);

    [this.firstClone, this.lastClone].forEach((clone) => {
      clone.setAttribute("aria-hidden", "true");
      clone.classList.add("slide--clone");

      clone.querySelectorAll("img").forEach((img) => {
        img.alt = "";
      });
    });

    this.track.replaceChildren(
      this.lastClone,
      ...this.slides,
      this.firstClone
    );
  }

  // Generate one dot for every real slide.
  buildDots() {
    this.dotsContainer.replaceChildren();

    this.slides.forEach((slide, index) => {
      const dot = document.createElement("button");

      dot.type = "button";
      dot.className = "slider__dot";
      dot.dataset.index = index;
      dot.setAttribute("aria-label", `Go to image ${index + 1}`);

      this.dotsContainer.append(dot);
    });

    this.dots = Array.from(
      this.dotsContainer.querySelectorAll(".slider__dot")
    );
  }

  bindEvents() {
    this.nextButton?.addEventListener("click", this.handleNext);
    this.prevButton?.addEventListener("click", this.handlePrevious);

    this.root.addEventListener("keydown", this.handleKeydown);
    this.track.addEventListener(
      "transitionend",
      this.handleTransitionEnd
    );

    // One delegated listener handles every dot.
    this.dotsContainer.addEventListener(
      "click",
      this.handleDotClick
    );
  }

  navigate(direction) {
    this.runOrQueue({ type: direction });
  }

  next() {
    this.navigate("next");
  }

  previous() {
    this.navigate("previous");
  }

  goTo(targetIndex) {
    if (
      !Number.isInteger(targetIndex) ||
      targetIndex < 0 ||
      targetIndex >= this.slides.length
    ) {
      return;
    }

    this.runOrQueue({ type: "goTo", index: targetIndex });
  }

  // Never discard navigation requests during animation.
  runOrQueue(action) {
    if (this.destroyed) return;

    if (this.isAnimating) {
      this.queue.push(action);
      return;
    }

    this.performAction(action);
  }

  performAction(action) {
    const count = this.slides.length;

    if (action.type === "next") {
      this.index = (this.index + 1) % count;
      this.position = this.index === 0 ? count + 1 : this.index + 1;
    } else if (action.type === "previous") {
      this.index = (this.index - 1 + count) % count;
      this.position = this.index === count - 1 && this.position === 1
        ? 0
        : this.index + 1;
    } else if (action.type === "goTo") {
      this.index = action.index;
      this.position = this.index + 1;
    }

    this.updateUI();
    this.animateTo(this.position);
  }

  animateTo(position) {
    this.position = position;
    this.isAnimating = true;

    this.track.style.transition =
      `transform ${this.duration}ms cubic-bezier(0.22, 0.75, 0.25, 1)`;

    this.setPosition(position);
  }

  setPosition(position) {
    this.track.style.transform =
      `translateX(-${position * 100}%)`;
  }

  finishAnimation() {
    const count = this.slides.length;

    // Reached the clone of the first slide.
    if (this.position === count + 1) {
      this.track.style.transition = "none";
      this.position = 1;
      this.setPosition(1);
      void this.track.offsetWidth;
    }

    // Reached the clone of the last slide.
    if (this.position === 0) {
      this.track.style.transition = "none";
      this.position = count;
      this.setPosition(count);
      void this.track.offsetWidth;
    }

    this.track.style.transition =
      `transform ${this.duration}ms cubic-bezier(0.22, 0.75, 0.25, 1)`;

    this.isAnimating = false;

    // Process the next queued click.
    const nextAction = this.queue.shift();

    if (nextAction) {
      this.performAction(nextAction);
    }
  }

  updateUI() {
    this.dots.forEach((dot, index) => {
      const active = index === this.index;

      dot.setAttribute("aria-current", String(active));
    });

    if (this.status) {
      this.status.textContent =
        `Image ${this.index + 1} of ${this.slides.length}`;
    }
  }

  setupResizeObserver() {
    if (!("ResizeObserver" in window)) return;

    this.resizeObserver = new ResizeObserver(() => {
      if (this.isAnimating) return;

      this.track.style.transition = "none";
      this.setPosition(this.index + 1);
      this.position = this.index + 1;
      void this.track.offsetWidth;

      this.track.style.transition =
        `transform ${this.duration}ms cubic-bezier(0.22, 0.75, 0.25, 1)`;
    });

    this.resizeObserver.observe(this.root);
  }

  // Remove every registered listener and observer.
  destroy() {
    if (this.destroyed) return;

    this.destroyed = true;
    this.queue = [];

    this.nextButton?.removeEventListener("click", this.handleNext);
    this.prevButton?.removeEventListener("click", this.handlePrevious);

    this.root.removeEventListener("keydown", this.handleKeydown);

    this.track.removeEventListener(
      "transitionend",
      this.handleTransitionEnd
    );

    this.dotsContainer.removeEventListener(
      "click",
      this.handleDotClick
    );

    this.resizeObserver?.disconnect();

    this.track.style.transition = "none";
this.track.replaceChildren(...this.slides);
this.track.style.transform = "translateX(0)";
this.dotsContainer.replaceChildren();
  }
}

document.addEventListener("DOMContentLoaded", () => {
  const root = document.querySelector(".slider");

  if (root) {
    window.imageSlider = new ImageSlider(root, {
      duration: 520
    });
  }
});
