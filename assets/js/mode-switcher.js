$(document).ready(() => modeSwitcher())

if (!localStorage.getItem('color-theme')) {
	document.documentElement.setAttribute('data-theme', 'dark');
}
else {
	document.documentElement.setAttribute('data-theme', localStorage.getItem('color-theme'));
}

/**
 * Page theme switching between *light* and *dark*
 * 
 * Initialize page theme and set event handlers
 */
function modeSwitcher() {

	switch (localStorage.getItem('color-theme')) {
		case 'dark':
			$('.theme-toggle').removeAttr('checked');
			break;
		case 'light':
			$('.theme-toggle').attr('checked', '');
			break;
	}

	/* 
	 * dark-light mode-switcher
	 * Change the icons inside the button based on previous settings
	 */
	$('.theme-toggle').off('click').on('click', function () {

		// if exists and set via local storage previously
		if ($(document.documentElement).attr('data-theme') === "dark") {
			document.documentElement.setAttribute('data-theme', 'light');
			localStorage.setItem('color-theme', 'light');
			setGiscusTheme("light");
		} else {
			document.documentElement.setAttribute('data-theme', 'dark');
			localStorage.setItem('color-theme', 'dark');
			setGiscusTheme("dark");
		}

	});
} 

function setGiscusTheme(color) {
	function sendMessage(message) {
		const iframe = document.querySelector('iframe.giscus-frame');
		if (!iframe) return;
		iframe.contentWindow.postMessage({ giscus: message }, 'https://giscus.app');
	}
	sendMessage({
		setConfig: {
			theme: color,
		},
	});
}