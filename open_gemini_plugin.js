(() => {
    const PLUGIN_ID = 'open_gemini_app';
    const APP_URL = 'https://github.com/LinuxFlow1/lampa-plugin'; // URL вашего репозитория или целевой страницы
    const PLUGIN_NAME = 'Open Gemini App';

    const GITHUB_USER = 'LinuxFlow1';
    const REPO_NAME = 'lampa-plugin';
    const BRANCH_NAME = 'main';
    const FILE_PATH = 'open_gemini_plugin.js';
    const CONFIG_FILE_PATH = 'config.json'; // Файл конфигурации

    const GITHUB_FILE_URL = `https://raw.githubusercontent.com/${GITHUB_USER}/${REPO_NAME}/${BRANCH_NAME}/${FILE_PATH}`;
    const GITHUB_CONFIG_URL = `https://raw.githubusercontent.com/${GITHUB_USER}/${REPO_NAME}/${BRANCH_NAME}/${CONFIG_FILE_PATH}`;

    const log = (message, type = 'info') => {
        const formattedMessage = `[${PLUGIN_NAME}]: ${message}`;
        console[type](formattedMessage);

        if (window.Lampa && Lampa.Notification) {
            Lampa.Notification.create({
                title: PLUGIN_NAME,
                text: message,
                time: 5000,
                type: type === 'error' ? 'error' : 'success'
            });
        }
    };

    const showError = (error) => {
        log(error.message || 'An error occurred', 'error');
    };

    const openApp = () => {
        try {
            if (window.confirm("Do you want to open the application?")) {
                window.open(APP_URL, '_blank');
                log('Application opened.');
            } else {
                log('User canceled opening the application.');
            }
        } catch (error) {
            showError(error);
        }
    };

    const createPlugin = (config) => {
        try {
            if (window.Lampa && Lampa.Plugin) {
                Lampa.Plugin.create({
                    title: config.pluginTitle || 'Open Application',
                    icon: config.iconUrl || `https://github.com/${GITHUB_USER}/${REPO_NAME}/raw/${BRANCH_NAME}/assets/icon.png`, // URL иконки из GitHub
                    description: config.description || 'Open the application through an external link.',
                    id: PLUGIN_ID,
                    onClick: openApp,
                    onReady: () => log('Plugin loaded successfully.'),
                    onExit: () => log('Plugin has been unloaded.'),
                    onUpdate: checkForUpdates
                });

                log('Plugin registered successfully.');
            } else {
                log('Lampa Plugin API not available.', 'error');
            }
        } catch (error) {
            showError(error);
        }
    };

    const loadScriptFromGitHub = (url, callback) => {
        const script = document.createElement('script');
        script.src = url;
        script.async = true;
        script.onload = () => {
            log(`Script loaded from ${url}`);
            callback(null, url);
        };
        script.onerror = (error) => {
            log(`Failed to load script from ${url}`, 'error');
            callback(new Error(`Failed to load script from ${url}`), url);
        };
        document.head.appendChild(script);
    };

    const loadConfigFromGitHub = (callback) => {
        fetch(GITHUB_CONFIG_URL)
            .then(response => {
                if (!response.ok) {
                    throw new Error(`Failed to fetch config from ${GITHUB_CONFIG_URL}`);
                }
                return response.json();
            })
            .then(config => {
                log('Configuration loaded successfully.');
                callback(null, config);
            })
            .catch(error => {
                log('Error loading configuration.', 'error');
                callback(error, null);
            });
    };

    const checkForUpdates = () => {
        log('Checking for updates...');
        fetch(`https://api.github.com/repos/${GITHUB_USER}/${REPO_NAME}/commits/${BRANCH_NAME}`)
            .then(response => response.json())
            .then(data => {
                const latestCommitDate = new Date(data.commit.committer.date);
                const lastUpdate = localStorage.getItem('plugin_last_update');
                if (!lastUpdate || new Date(lastUpdate) < latestCommitDate) {
                    if (window.confirm("A new version of the plugin is available. Do you want to update?")) {
                        localStorage.setItem('plugin_last_update', latestCommitDate.toString());
                        window.location.reload();
                    }
                } else {
                    log('No updates available.');
                }
            })
            .catch(error => {
                log('Failed to check for updates.', 'error');
            });
    };

    const initializePlugin = (config) => {
        if (window.Lampa) {
            createPlugin(config);
        } else {
            log('Lampa API not available.', 'error');
        }
    };

    const loadPluginFromGitHub = () => {
        log(`Loading plugin from GitHub: ${GITHUB_FILE_URL}`);
        loadScriptFromGitHub(GITHUB_FILE_URL, (error, url) => {
            if (error) {
                showError(error);
            } else {
                log(`Plugin loaded from ${url} successfully.`);
                loadConfigFromGitHub((configError, config) => {
                    if (configError) {
                        showError(configError);
                    } else {
                        initializePlugin(config);
                    }
                });
            }
        });
    };

    window.addEventListener('load', loadPluginFromGitHub);
})();
