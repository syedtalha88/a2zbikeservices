// ========================================
// 🚀 Lenis + GSAP ScrollTrigger Integration (CDN-safe)
// ========================================

document.addEventListener("DOMContentLoaded", () => {
    const { gsap, ScrollTrigger, Lenis } = window; // ✅ access globals from CDN
    gsap.registerPlugin(ScrollTrigger);

    // Initialize Lenis
    const lenis = new Lenis({
        duration: 1, // speed
        easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)), // https://www.desmos.com/calculator/brs54l4xou
        direction: "vertical", // vertical, horizontal
        gestureDirection: "vertical", // vertical, horizontal, both
        smooth: true,
        mouseMultiplier: 0.5, // sensibility
        smoothTouch: false, // Mobile
        touchMultiplier: 2, // sensibility on mobile
        infinite: false // Infinite scrolling
    });

    // Sync with ScrollTrigger
    lenis.on("scroll", ScrollTrigger.update);


    // RAF loop
    function raf(time) {
        lenis.raf(time);
        requestAnimationFrame(raf);
    }
    requestAnimationFrame(raf);

    // Example: fade-up elements
    // gsap.utils.toArray(".fade-up").forEach((el) => {
    //     gsap.from(el, {
    //         y: 60,
    //         opacity: 0,
    //         duration: 1,
    //         ease: "power2.out",
    //         scrollTrigger: {
    //             trigger: el,
    //             start: "top 85%",
    //             toggleActions: "play none none reverse",
    //         },
    //     });
    // });

    // Disable Lenis when Bootstrap modal opens
    document.addEventListener("shown.bs.modal", () => {
        lenis.stop(); // stops smooth scrolling
        document.documentElement.classList.add("lenis-stopped");
    });

    // Re-enable Lenis when modal closes
    document.addEventListener("hidden.bs.modal", () => {
        lenis.start(); // resumes smooth scrolling
        document.documentElement.classList.remove("lenis-stopped");
    });



});
