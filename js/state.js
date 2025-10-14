export const state = {
    currentLanguage: 'en',
    translations: {},
    navigationHistory: [],
};

export function setLanguage(lang) {
    state.currentLanguage = lang;
}

export function setTranslations(newTranslations) {
    state.translations = newTranslations;
}

export function pushHistory(historyState) {
    state.navigationHistory.push(historyState);
}

export function popHistory() {
    return state.navigationHistory.pop();
}

