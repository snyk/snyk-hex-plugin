import { mocked } from 'ts-jest/utils';

import { scan } from '../lib';
import * as path from 'path';

import { execute } from '../lib/sub-process';
jest.mock('../lib/sub-process', () => {
  return { execute: jest.fn() };
});

afterEach(() => {
  jest.clearAllMocks();
});

describe('scan', () => {
  it('Invalid mix/elixir', () => {
    mocked(execute).mockImplementation(
      getMockedExecutionFunction('reject', 'reject', 'reject'),
    );
    expect(() => runFixture('simple')).rejects.toThrow(
      'mix is not installed. please make sure Elixir is installed and try again.',
    );
  });
  it('Invalid hex but valid mix/elixir', () => {
    mocked(execute).mockImplementation(
      getMockedExecutionFunction('resolve', 'reject', 'reject'),
    );
    expect(() => runFixture('simple')).rejects.toThrow(
      'hex is not installed. please run `mix local.hex` and try again.',
    );
  });
  it('Valid hex and mix reaches the getMixResult function', async () => {
    mocked(execute).mockImplementation(
      getMockedExecutionFunction('resolve', 'resolve', 'reject'),
    );
    expect(() => runFixture('bad-manifest')).rejects.toThrow(
      /Error parsing manifest file/,
    );
  });
});

type MockOutcome = 'reject' | 'resolve';
type ExecutionMockFunction = (
  command: string,
  args: string[],
) => Promise<string>;

const getMockedExecutionFunction = (
  mixOutcome: MockOutcome,
  hexOutcome: MockOutcome,
  generalOutcome: MockOutcome,
): ExecutionMockFunction => (command: string, args: string[]) => {
  const getOutcomePromise = (outcome: MockOutcome) => {
    return outcome === 'reject'
      ? Promise.reject('Error')
      : Promise.resolve('Success');
  };

  if (command === 'mix' && args[0] === '-v') {
    return getOutcomePromise(mixOutcome);
  }
  if (command === 'mix' && args[0] === 'hex.info') {
    return getOutcomePromise(hexOutcome);
  }
  return getOutcomePromise(generalOutcome);
};

function runFixture(fixtureName: string, options?: any) {
  return scan({
    dev: true,
    path: path.resolve(__dirname, 'fixtures', fixtureName),
    ...options,
  });
}
