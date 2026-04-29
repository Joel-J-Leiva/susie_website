tailwind.config = {
    darkMode: "class",
    theme: {
        extend: {
            colors: {
                surface: "#fbf9f5", // Neutral cream/beige
                "on-surface": "#191c1e",
                background: "#fbf9f5",
                primary: "#7796a2", // Pastel blue for primary text/links
                secondary: "#d9b8c0", // Pastel pink
                tertiary: "#9eb3a2", // Sage/Pastel green
                "primary-container": "#9eb3a2", // Using pastel green for primary container/buttons
                "on-secondary": "#ffffff",
                "surface-container": "#efeeea",
                "surface-bright": "#fbf9f5",
                "on-primary-container": "#ffffff",
                "inverse-surface": "#30312e",
                "on-surface-variant": "#5b403d",
                "surface-container-low": "#f5f3ef",
                "surface-container-lowest": "#ffffff",
                "outline-variant": "#e1e2e4",
                "error": "#ba1a1a",
                "on-primary": "#ffffff",
                "outline": "#906f6c"
            },
            borderRadius: {
                DEFAULT: "0.125rem",
                lg: "0.25rem",
                xl: "0.5rem",
                full: "0.75rem"
            },
            fontFamily: {
                headline: ["Noto Serif"],
                body: ["Inter"],
                label: ["Inter"],
                display: "Noto Serif"
            }
        }
    }
};
