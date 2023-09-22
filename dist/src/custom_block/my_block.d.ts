import { Block, KnownBlock } from '@slack/types';
import { SummaryResults } from '..';
declare const generateCustomLayout: (summaryResults: SummaryResults) => Array<KnownBlock | Block>;
export default generateCustomLayout;
