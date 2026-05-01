/**
 * OpenCode plugin for lh-skills.
 *
 * Registers this repository's skills directory so OpenCode can discover
 * skills without manual skills.paths configuration.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export const LhSkillsPlugin = async () => {
  const skillsDir = path.resolve(__dirname, '../../skills');

  if (!fs.existsSync(skillsDir)) {
    throw new Error(`lh-skills plugin: missing skills directory at ${skillsDir}`);
  }

  return {
    config: async (config) => {
      config.skills = config.skills || {};
      config.skills.paths = config.skills.paths || [];

      if (!config.skills.paths.includes(skillsDir)) {
        config.skills.paths.push(skillsDir);
      }
    },
  };
};
