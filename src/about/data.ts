import { getAbout } from './query';
import { getAboutCached } from './cache';

export const getAboutData = () =>
  getAbout()
    .then(about => ({ about }));

export const getAboutDataCached = () =>
  getAboutCached()
    .then(about => ({ about }));
