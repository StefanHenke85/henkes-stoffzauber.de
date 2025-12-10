import { useState, useEffect } from 'react';
import { ArrowUp } from 'lucide-react';

export function ScrollToTop() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const toggleVisibility = () => {
      // Show button when page is scrolled down 300px
      if (window.scrollY > 300) {
        setIsVisible(true);
      } else {
        setIsVisible(false);
      }
    };

    window.addEventListener('scroll', toggleVisibility);

    return () => window.removeEventListener('scroll', toggleVisibility);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    });
  };

  return (
    <>
      {isVisible && (
        <button
          onClick={scrollToTop}
          className="fixed bottom-8 right-24 z-[9999] p-4 bg-primary-400 text-white rounded-full shadow-lg hover:bg-primary-500 transition-all hover:scale-110 focus:outline-none focus:ring-2 focus:ring-primary-400 focus:ring-offset-2 animate-fade-in"
          aria-label="Zurück nach oben"
        >
          <ArrowUp className="h-6 w-6" />
        </button>
      )}
    </>
  );
}
