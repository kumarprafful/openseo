import React from 'react';
import { Box, Text, useInput } from 'ink';

interface Props {
  siteUrl: string;
  siteName: string;
  contentDir: string;
  localesStr: string;
  defaultLocale: string;
  onSiteUrlChange: (v: string) => void;
  onSiteNameChange: (v: string) => void;
  onContentDirChange: (v: string) => void;
  onLocalesChange: (v: string) => void;
  onDefaultLocaleChange: (v: string) => void;
  onSubmit: () => void;
  onBack: () => void;
}

type Field = 'url' | 'name' | 'content' | 'locales' | 'default';

const CHARS: Record<string, string> = {};

export function ScaffoldInputForm(props: Props) {
  const [field, setField] = React.useState<Field>('url');
  const [editing, setEditing] = React.useState(false);
  const [buf, setBuf] = React.useState('');

  const values: Record<Field, { value: string; set: (v: string) => void }> = {
    url: { value: props.siteUrl, set: props.onSiteUrlChange },
    name: { value: props.siteName, set: props.onSiteNameChange },
    content: { value: props.contentDir, set: props.onContentDirChange },
    locales: { value: props.localesStr, set: props.onLocalesChange },
    default: { value: props.defaultLocale, set: props.onDefaultLocaleChange },
  };

  const labels: Record<Field, string> = {
    url: 'Site URL',
    name: 'Site name',
    content: 'Content directory',
    locales: 'Supported locales (comma-separated)',
    default: 'Default locale',
  };

  useInput((input, key) => {
    if (key.escape) {
      if (editing) {
        setEditing(false);
      } else {
        props.onBack();
      }
      return;
    }

    if (editing) {
      if (key.return) {
        values[field].set(buf);
        setEditing(false);
      } else if (key.backspace || key.delete) {
        setBuf((p) => p.slice(0, -1));
      } else if (input.length === 1 && input.charCodeAt(0) >= 32) {
        setBuf((p) => p + input);
      }
      return;
    }

    if (key.upArrow || input === 'k') {
      const fields: Field[] = ['url', 'name', 'content', 'locales', 'default'];
      const idx = fields.indexOf(field);
      setField(fields[Math.max(0, idx - 1)]);
    } else if (key.downArrow || input === 'j') {
      const fields: Field[] = ['url', 'name', 'content', 'locales', 'default'];
      const idx = fields.indexOf(field);
      setField(fields[Math.min(fields.length - 1, idx + 1)]);
    } else if (key.return) {
      if (field === 'default') {
        props.onSubmit();
      } else {
        setBuf(values[field].value);
        setEditing(true);
      }
    }
  });

  const fields: Field[] = ['url', 'name', 'content', 'locales', 'default'];

  return (
    <Box flexDirection="column" padding={1}>
      <Box marginBottom={1}>
        <Text bold>📦  Scaffold SEO Infrastructure</Text>
      </Box>
      <Box marginBottom={1}>
        <Text dimColor>Enter values below, then press Enter to continue to feature selection</Text>
      </Box>

      {fields.map((f) => {
        const isActive = field === f;
        const val = values[f].value;
        const display = editing && isActive ? buf : val;

        return (
          <Box key={f}>
            <Text>{isActive ? '▸' : ' '}</Text>
            <Text> </Text>
            <Box width={40}>
              <Text bold={isActive}>
                {labels[f]}:
              </Text>
            </Box>
            <Text color={isActive ? 'cyan' : 'white'}>
              {editing && isActive ? `${display}█` : display}
            </Text>
          </Box>
        );
      })}

      <Box marginTop={1}>
        <Text dimColor>↑/↓: navigate • Enter: edit • Esc: back</Text>
      </Box>
    </Box>
  );
}
