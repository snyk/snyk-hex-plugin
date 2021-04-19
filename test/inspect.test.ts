import { inspect } from '../lib';
import * as path from 'upath';
import { cleanTargetFile } from './utils';
import { ScannedProject } from '../lib/inspect';

describe('inspect', () => {
  verifyFixture('simple', { allProjects: false });
  verifyFixture('simple', {
    allProjects: false,
    projectName: 'renamed-package',
  });
  verifyFixture('umbrella', { allProjects: false });
  verifyFixture('umbrella/apps/api', { allProjects: false });
  verifyFixture('umbrella', { allProjects: true }, 'mix.exs');
  verifyFixture('umbrella', { allProjects: true }, 'apps/api/mix.exs');
  verifyFixture('umbrella', {
    allProjects: false,
    projectName: 'renamed-package',
  });
  verifyFixture('umbrella', {
    allProjects: true,
    projectName: 'renamed-package',
  });
});

function verifyFixture(
  fixtureName: string,
  options: { allProjects: boolean; projectName?: string },
  targetFile = 'mix.exs',
) {
  it(`${fixtureName}${targetFile === 'mix.exs' ? '' : '/' + targetFile}${
    options.allProjects ? ', allProjects = true' : ''
  }${options.projectName ? `, ${options.projectName}` : ''}`, async () => {
    const result = await inspect(
      path.resolve(__dirname, `fixtures/${fixtureName}`),
      targetFile,
      {
        dev: true,
        allProjects: options.allProjects,
        'project-name': options.projectName,
      },
    );

    const {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      plugin: { runtime, ...plugin },
      scannedProjects,
    } = result;

    expect(plugin).toMatchSnapshot('plugin');
    expect(scannedProjects?.length).toMatchSnapshot('length');

    for (const scannedProject of scannedProjects) {
      expect(clean(scannedProject)).toMatchSnapshot(
        cleanTargetFile(scannedProject.targetFile),
      );
    }
  });
}

function clean(scannedProject: ScannedProject) {
  return {
    ...scannedProject,
    targetFile: cleanTargetFile(scannedProject.targetFile!),
  };
}
