import React, { useState, useEffect } from 'react';
import { Box, Text, useInput } from 'ink';
import { useAppState } from '../state.js';
import { ALL_TEMPLATES, rankFeatures, scaffoldFiles, renderTemplate } from '../templates.js';
import { ScaffoldInputForm } from './scaffold-input.js';
import { ScaffoldResult } from './scaffold-result.js';

type Mode = 'info' | 'select' | 'executing' | 'complete';

export function ScaffoldScreen() {
  const { setScreen, projectInfo, existingSEO } = useAppState();
  const [mode, setMode] = useState<Mode>('info');
  const [cursor, setCursor] = useState(0);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [results, setResults] = useState<Array<{ path: string; skipped: boolean }>>([]);

  const [siteUrl, setSiteUrl] = useState(projectInfo?.frameworkVersion ? `https://${projectInfo.frameworkVersion}` : 'https://example.com');
  const [siteName, setSiteName] = useState('My Site');
  const [contentDir, setContentDir] = useState(projectInfo?.contentDir || 'content/blog');
  const [localesStr, setLocalesStr] = useState(projectInfo?.locales.join(',') || 'en');
  const [defaultLocale, setDefaultLocale] = useState(projectInfo?.defaultLocale || 'en');

  const locales = localesStr.split(',').map((l) => l.trim()).filter(Boolean);

  const sortedTemplates = React.useMemo(() => {
    const missing = ALL_TEMPLATES.filter((t) => existingSEO && !existingSEO[t.id as keyof typeof existingSEO]);
    const present = ALL_TEMPLATES.filter((t) => existingSEO && existingSEO[t.id as keyof typeof existingSEO]);
    return [...rankFeatures(missing.map((t) => t.id)), ...present];
  }, []);

  useEffect(() => {
    if (mode === 'select' && selected.size === 0) {
      const missing = ALL_TEMPLATES.filter((t) => existingSEO && !existingSEO[t.id as keyof typeof existingSEO]);
      setSelected(new Set(missing.map((t) => t.id)));
    }
  }, [mode]);

  function executeScaffold() {
    const vars = {
      siteUrl,
      siteName,
      contentDir,
      locales,
      defaultLocale,
      analyticsProvider: 'none',
      analyticsScriptUrl: '',
      analyticsSiteId: '',
      ogType: 'dynamic',
      features: Array.from(selected),
    };

    setMode('executing');
    setTimeout(() => {
      const files = scaffoldFiles(vars, process.cwd());
      setResults(files.map((f) => ({ path: f.path, skipped: f.skipped })));
      setMode('complete');
    }, 50);
  }

  useInput((input, key) => {
    if (key.escape) {
      if (mode === 'select') { setMode('info'); return; }
      setScreen('main-menu');
      return;
    }

    if (mode === 'info' && key.return) {
      setMode('select');
      setCursor(0);
      return;
    }

    if (mode === 'select') {
      if (key.upArrow || input === 'k') setCursor((p) => Math.max(0, p - 1));
      else if (key.downArrow || input === 'j') setCursor((p) => Math.min(sortedTemplates.length - 1, p + 1));
      else if (input === ' ') {
        const id = sortedTemplates[cursor]?.id;
        if (id) setSelected((prev) => { const n = new Set(prev); if (n.has(id)) n.delete(id); else n.add(id); return n; });
      } else if (key.return && selected.size > 0) executeScaffold();
      else if (input === 'a') setSelected(new Set(sortedTemplates.map((t) => t.id)));
      else if (input === 'n') setSelected(new Set());
      return;
    }
  });

  if (mode === 'info') {
    return (
      <ScaffoldInputForm
        siteUrl={siteUrl}
        siteName={siteName}
        contentDir={contentDir}
        localesStr={localesStr}
        defaultLocale={defaultLocale}
        onSiteUrlChange={setSiteUrl}
        onSiteNameChange={setSiteName}
        onContentDirChange={setContentDir}
        onLocalesChange={setLocalesStr}
        onDefaultLocaleChange={setDefaultLocale}
        onSubmit={() => setMode('select')}
        onBack={() => setScreen('main-menu')}
      />
    );
  }

  if (mode === 'complete') {
    return (
      <ScaffoldResult
        results={results}
        projectDir={process.cwd()}
        hasContentDir={!!contentDir}
        onBack={() => setScreen('main-menu')}
      />
    );
  }

  if (mode === 'executing') {
    return (
      <Box flexDirection="column" padding={1}>
        <Text bold>📦  Scaffolding...</Text>
        <Box height={1} />
        {Array.from(selected).map((id) => {
          const tpl = ALL_TEMPLATES.find((t) => t.id === id);
          return <Text key={id}>○ {tpl?.outputPath || id}</Text>;
        })}
      </Box>
    );
  }

  return (
    <Box flexDirection="column" padding={1}>
      <Box marginBottom={1}><Text bold>📦  Scaffold SEO Infrastructure</Text></Box>
      <Box flexDirection="column" marginBottom={1}>
        <Text dimColor>Site: {siteUrl}</Text>
        <Text dimColor>Content: {contentDir}</Text>
        <Text dimColor>Locales: {localesStr}</Text>
      </Box>
      <Box flexDirection="column">
        <Text bold underline>Features</Text>
        <Text dimColor>  Space: toggle  a: all  n: none  Enter: scaffold  Esc: back</Text>
        <Box height={1} />
        {sortedTemplates.map((tpl, i) => {
          const isSelected = selected.has(tpl.id);
          const isMissing = existingSEO && !existingSEO[tpl.id as keyof typeof existingSEO];
          const impactColor = tpl.impact === 'critical' ? 'red' : tpl.impact === 'high' ? 'yellow' : tpl.impact === 'medium' ? 'blue' : 'green';
          return (
            <Box key={tpl.id}>
              <Text>{i === cursor ? <Text color="cyan">▸</Text> : <Text> </Text>}  <Text color={isSelected ? 'green' : 'gray'}>{isSelected ? '◉' : '○'}</Text>  <Text bold={i === cursor}>{tpl.name}</Text>  <Text color={impactColor}>({tpl.impact})</Text>{isMissing ? <Text color="red"> missing</Text> : null}</Text>
            </Box>
          );
        })}
      </Box>
    </Box>
  );
}
