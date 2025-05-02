// Show/hide flash messages after 5 seconds
document.addEventListener('DOMContentLoaded', function() {
    // Handle flash messages
    const flashMessages = document.querySelectorAll('.bg-red-100, .bg-green-100');
    if (flashMessages.length > 0) {
        setTimeout(() => {
            flashMessages.forEach(msg => {
                msg.style.opacity = '0';
                msg.style.transition = 'opacity 0.5s';
                setTimeout(() => msg.remove(), 500);
            });
        }, 5000);
    }

    // Enable language switcher functionality
    const languageToggle = document.getElementById('language-toggle');
    if (languageToggle) {
        languageToggle.addEventListener('change', function() {
            // This is a placeholder for language switching functionality
            console.log('Language switched to: ', this.checked ? 'Hindi' : 'English');
            // In a real implementation, this would trigger translation
        });
    }
}); 