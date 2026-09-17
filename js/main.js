(function () {
  "use strict";

  document.addEventListener("DOMContentLoaded", function () {
    initRevealAnimations();
    initAutoplayVideos();
    initSectionProgress();
  });

  function initRevealAnimations() {
    var nodes = document.querySelectorAll("[data-reveal]");
    if (!nodes.length) {
      return;
    }

    var reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reducedMotion || !("IntersectionObserver" in window)) {
      nodes.forEach(function (node) {
        node.classList.add("is-visible");
      });
      return;
    }

    var observer = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) {
            return;
          }
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        });
      },
      { threshold: 0.18 }
    );

    nodes.forEach(function (node) {
      observer.observe(node);
    });
  }

  function initAutoplayVideos() {
    var videos = Array.prototype.slice.call(document.querySelectorAll("video[autoplay]"));
    if (!videos.length || !("IntersectionObserver" in window)) {
      return;
    }

    var play = function (video) {
      var attempt = video.play();
      if (attempt && typeof attempt.catch === "function") {
        attempt.catch(function () {});
      }
    };

    videos.forEach(function (video) {
      video.addEventListener("pause", function () {
        if (video.dataset.viewportPaused === "true" || video.ended) {
          return;
        }
        if (video.hasAttribute("controls")) {
          video.dataset.userPaused = "true";
        }
      });

      video.addEventListener("play", function () {
        delete video.dataset.userPaused;
      });
    });

    var observer = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          var video = entry.target;
          if (entry.isIntersecting) {
            if (video.dataset.userPaused !== "true") {
              play(video);
            }
            return;
          }

          if (!video.paused) {
            video.dataset.viewportPaused = "true";
            video.pause();
            window.setTimeout(function () {
              delete video.dataset.viewportPaused;
            }, 0);
          }
        });
      },
      { rootMargin: "150px 0px", threshold: 0.1 }
    );

    videos.forEach(function (video) {
      observer.observe(video);
    });
  }

  function initSectionProgress() {
    var items = Array.prototype.slice.call(document.querySelectorAll(".progress-item[data-section]"));
    if (!items.length) {
      return;
    }

    var entries = items
      .map(function (item) {
        var id = item.dataset.section;
        return {
          id: id,
          item: item,
          link: item.querySelector("a"),
          section: document.getElementById(id),
        };
      })
      .filter(function (entry) {
        return entry.section && entry.link;
      });

    if (!entries.length) {
      return;
    }

    var track = document.querySelector(".progress-track");
    var fill = document.querySelector(".progress-line-fill");
    var reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    var raf = 0;

    var setActive = function (activeIndex) {
      entries.forEach(function (entry, index) {
        var active = index === activeIndex;
        entry.item.classList.toggle("active", active);
        entry.item.classList.toggle("passed", index < activeIndex);
        if (active) {
          entry.link.setAttribute("aria-current", "true");
        } else {
          entry.link.removeAttribute("aria-current");
        }
      });

      if (!track || !fill) {
        return;
      }

      var firstDot = entries[0].item.querySelector(".progress-dot");
      var activeDot = entries[activeIndex].item.querySelector(".progress-dot");
      if (!firstDot || !activeDot) {
        return;
      }

      var trackTop = track.getBoundingClientRect().top;
      var start = firstDot.getBoundingClientRect().top + firstDot.offsetHeight / 2 - trackTop;
      var end = activeDot.getBoundingClientRect().top + activeDot.offsetHeight / 2 - trackTop;
      fill.style.top = start + "px";
      fill.style.height = Math.max(0, end - start) + "px";
    };

    var sync = function () {
      raf = 0;
      var probe = Math.min(window.innerHeight * 0.22, 160);
      var activeIndex = 0;
      entries.forEach(function (entry, index) {
        if (entry.section.getBoundingClientRect().top <= probe) {
          activeIndex = index;
        }
      });
      setActive(activeIndex);
    };

    var queueSync = function () {
      if (raf) {
        return;
      }
      raf = window.requestAnimationFrame(sync);
    };

    entries.forEach(function (entry, index) {
      entry.link.addEventListener("click", function () {
        setActive(index);
      });
    });

    setActive(0);
    queueSync();
    window.addEventListener("scroll", queueSync, { passive: true });
    window.addEventListener("resize", queueSync, { passive: true });

    if (window.location.hash) {
      var hashIndex = entries.findIndex(function (entry) {
        return "#" + entry.id === window.location.hash;
      });
      if (hashIndex >= 0) {
        setActive(hashIndex);
      }
    }

    if (reducedMotion) {
      document.documentElement.style.scrollBehavior = "auto";
    }
  }
})();
