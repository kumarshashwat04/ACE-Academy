export type ScoreRecord = {
  uid: string;
  pid: string;
  cid: string;
  score: number;
  passed: boolean;
};

export type DoneRecord = Record<string, string>;

export type ProgressSnapshot = {
  scores: ScoreRecord[];
  done: DoneRecord;
};
