import { createStore } from 'zustand';
import { useStore } from 'zustand';
import type { ProjectInfo, ExistingSEO } from '@openseo/core';
import type { ProviderType } from '@openseo/agents';

export type Screen = 'main-menu' | 'scaffold' | 'audit' | 'geo' | 'content' | 'settings' | 'scaffold-input' | 'scaffold-complete';

export interface ScaffoldInputState {
  siteUrl: string;
  siteName: string;
  contentDir: string;
  locales: string;
  defaultLocale: string;
  analyticsProvider: 'umami' | 'google-analytics' | 'plausible' | 'none';
  analyticsScriptUrl: string;
  analyticsSiteId: string;
  ogType: 'dynamic' | 'static' | 'none';
  selectedFeatures: string[];
}

export interface ProviderState {
  provider: ProviderType;
  apiKey: string;
  model: string;
  baseUrl: string;
}

export interface AppState {
  screen: Screen;
  setScreen: (screen: Screen) => void;
  projectDir: string;
  projectInfo: ProjectInfo | null;
  existingSEO: ExistingSEO | null;
  setProjectData: (info: ProjectInfo, seo: ExistingSEO) => void;
  scaffoldInput: ScaffoldInputState;
  updateScaffoldInput: (partial: Partial<ScaffoldInputState>) => void;
  setScaffoldInput: (input: ScaffoldInputState) => void;
  providerConfig: ProviderState;
  updateProviderConfig: (partial: Partial<ProviderState>) => void;
}

const defaultScaffoldInput: ScaffoldInputState = {
  siteUrl: 'https://example.com',
  siteName: '',
  contentDir: 'content/blog',
  locales: 'en',
  defaultLocale: 'en',
  analyticsProvider: 'none',
  analyticsScriptUrl: '',
  analyticsSiteId: '',
  ogType: 'dynamic',
  selectedFeatures: [],
};

const store = createStore<AppState>((set) => ({
  screen: 'main-menu',
  setScreen: (screen) => set({ screen }),
  projectDir: process.cwd(),
  projectInfo: null,
  existingSEO: null,
  setProjectData: (info, seo) => set({ projectInfo: info, existingSEO: seo }),
  scaffoldInput: { ...defaultScaffoldInput },
  updateScaffoldInput: (partial) =>
    set((state) => ({ scaffoldInput: { ...state.scaffoldInput, ...partial } })),
  setScaffoldInput: (input) => set({ scaffoldInput: input }),
  providerConfig: { provider: 'openai', apiKey: '', model: '', baseUrl: '' },
  updateProviderConfig: (partial) =>
    set((state) => ({ providerConfig: { ...state.providerConfig, ...partial } })),
}));

export function useAppState() {
  return useStore(store);
}
