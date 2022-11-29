import * as path from 'upath';
import { scan } from '../lib';
import * as subProcess from '../lib/sub-process';
import { getMixCmd } from '../lib/mixCmd';

jest.mock('../lib/sub-process', () => {
  return { execute: jest.fn() };
});

afterEach(() => {
  jest.clearAllMocks();
});

describe('scan', () => {
  it('Invalid mix/elixir', () => {
    jest
      .spyOn(subProcess, 'execute')
      .mockImplementation(getMockedExecutionFunction('reject', 'reject'));
    expect(() => runFixture('simple')).rejects.toThrow(
      'mix is not installed. please make sure Elixir is installed and try again.',
    );
  });
  it('Valid mix reaches the getMixResult function', async () => {
    jest
      .spyOn(subProcess, 'execute')
      .mockImplementation(getMockedExecutionFunction('resolve', 'reject'));
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

const getMockedExecutionFunction =
  (
    mixOutcome: MockOutcome,
    generalOutcome: MockOutcome,
  ): ExecutionMockFunction =>
  (command: string, args: string[]) => {
    const getOutcomePromise = (outcome: MockOutcome) => {
      return outcome === 'reject'
        ? Promise.reject('Error')
        : Promise.resolve('Success');
    };

    if (command === getMixCmd() && args[0] === '-v') {
      return getOutcomePromise(mixOutcome);
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
