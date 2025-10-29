/**
 * This module contains all functions for state management.
 * Keeps track of the current language, a dictionary of translations, a nav history stack.
 */
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

