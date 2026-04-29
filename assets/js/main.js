document.addEventListener("DOMContentLoaded", () => {
    // Inject the toast div if it doesn't exist
    if (!document.getElementById("emailToast")) {
        const toast = document.createElement("div");
        toast.id = "emailToast";
        toast.className = "fixed bottom-10 left-1/2 -translate-x-1/2 bg-[#191c1e] text-[#fbf9f5] px-6 py-3 rounded-full font-sans text-sm uppercase tracking-widest font-bold transition-all duration-300 transform translate-y-20 opacity-0 z-50 shadow-xl pointer-events-none";
        toast.innerText = "Email copied!";
        document.body.appendChild(toast);
    }

    function copyEmail() {
        const email = "berubes@kean.edu";
        if (navigator.clipboard && window.isSecureContext) {
            navigator.clipboard.writeText(email).then(showToast).catch(() => fallbackCopy(email));
        } else {
            fallbackCopy(email);
        }
    }
    
    function fallbackCopy(text) {
        const textArea = document.createElement("textarea");
        textArea.value = text;
        textArea.style.position = "fixed";
        textArea.style.left = "-9999px";
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        try {
            document.execCommand('copy');
            showToast();
        } catch (err) {
            console.error('Fallback: Oops, unable to copy', err);
        }
        document.body.removeChild(textArea);
    }

    function showToast() {
        const toast = document.getElementById('emailToast');
        if (!toast) return;
        toast.classList.remove('translate-y-20', 'opacity-0');
        setTimeout(() => {
            toast.classList.add('translate-y-20', 'opacity-0');
        }, 3000);
    }

    document.getElementById('copyMailBtn')?.addEventListener('click', copyEmail);
    document.getElementById('footerContactBtn')?.addEventListener('click', copyEmail);
    document.getElementById('getInTouchBtn')?.addEventListener('click', copyEmail);

    // Mobile Menu Toggle
    const mobileMenuBtn = document.getElementById('mobileMenuBtn');
    const mobileMenu = document.getElementById('mobileMenu');
    
    if (mobileMenuBtn && mobileMenu) {
        mobileMenuBtn.addEventListener('click', () => {
            mobileMenu.classList.toggle('hidden');
            mobileMenu.classList.toggle('flex');
            // Toggle icon from menu to close
            if (mobileMenuBtn.innerText.trim() === 'menu') {
                mobileMenuBtn.innerText = 'close';
            } else {
                mobileMenuBtn.innerText = 'menu';
            }
        });
    }
});
