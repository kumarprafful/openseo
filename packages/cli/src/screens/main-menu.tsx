import React, { useEffect, useState } from 'react';
import { Box, Text, useInput } from 'ink';
import { useAppState } from '../state.js';
import { runProjectDetection, type ProjectInfo, type ExistingSEO } from '@openseo/core';

const defaultVars = {
  siteUrl: 'https://example.com',
  siteName: '',
  contentDir: 'content/blog',
  locales: 'en',
  defaultLocale: 'en',
  analyticsProvider: 'umami' as const,
  analyticsScriptUrl: '',
  analyticsSiteId: '',
  ogType: 'dynamic' as const,
  selectedFeatures: [
    'structured-data', 'breadcrumb', 'sitemap', 'robots-txt',
  ],
};

export function MainMenu() {
  const { setScreen, setProjectData, projectInfo, existingSEO } = useAppState();
  const [detecting, setDetecting] = useState(true);
  const [health, setHealth] = useState({ total: 9, missing: 0, score: 0 });

  useEffect(() => {
    async function detect() {
      try {
        const result = await runProjectDetection(process.cwd());
        setProjectData(result.projectInfo, result.existingSEO);

        const seo = result.existingSEO;
        const total = 9;
        const missing = Object.entries(seo).filter(([, v]) => !v).length;
        const score = Math.round(((total - missing) / total) * 100);
        setHealth({ total, missing, score });
      } catch (e) {
        // Detection failed, still show menu
      }
      setDetecting(false);
    }
    detect();
  }, []);

  useInput((input) => {
    switch (input) {
      case '1': setScreen('audit'); break;
      case '2': setScreen('scaffold'); break;
      case '3': setScreen('geo'); break;
      case '4': setScreen('content'); break;
      case '5': setScreen('settings'); break;
      case 'q': process.exit(0); break;
    }
  });

  return (
    <Box flexDirection="column" padding={1}>
      <Box>
        <Text bold>OpenSEO</Text>
        <Text>  v0.1.0</Text>
      </Box>
      <Box>
        <Text> </Text>
      </Box>

      {detecting ? (
        <Text>○ Detecting project...</Text>
      ) : (
        <>
          {projectInfo && (
            <Box flexDirection="column">
              <Text>
                Project: <Text bold>{projectInfo.framework === 'nextjs' ? 'Next.js' : projectInfo.framework}</Text>
                {projectInfo.appRouter ? ' (App Router)' : ''}
                {projectInfo.locales.length > 1 ? ` · ${projectInfo.locales.length} locales` : ''}
                {projectInfo.contentDir ? ` · Content: ${projectInfo.contentDir}` : ''}
              </Text>
              <Text>  </Text>
              <Text>
                Health:{' '}
                <Text bold color={health.score >= 70 ? 'green' : health.score >= 40 ? 'yellow' : 'red'}>
                  {health.score}/100
                </Text>
                {'  '}
                <Text>{health.missing} issue{health.missing !== 1 ? 's' : ''} found</Text>
              </Text>
              <Text>  </Text>
            </Box>
          )}

          <Box flexDirection="column">
            <Text>1)  🛠  Audit & Fix</Text>
            <Text>2)  📦  Scaffold SEO Infrastructure</Text>
            <Text>3)  🌐  GEO Analysis</Text>
            <Text>4)  📝  Content Strategy</Text>
            <Text>5)  ⚙️  Settings</Text>
            <Text>q)  Quit</Text>
          </Box>
        </>
      )}
    </Box>
  );
}
