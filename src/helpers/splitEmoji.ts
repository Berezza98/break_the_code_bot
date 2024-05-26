export const splitEmoji = (string: string) => [...new Intl.Segmenter().segment(string)].map((x) => x.segment);
