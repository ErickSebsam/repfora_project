import { randomUUID } from "crypto";

const uploadJobs = new Map();
const JOB_TTL_MS = 10 * 60 * 1000;

const jobStore = {};

jobStore.createJob = () => {
  const jobId = randomUUID();
  const state = {
    percent: 0,
    created: 0,
    skippedVirtual: 0,
    errors: 0,
    total: 0,
    errorDetails: [],
    done: false,
    failed: false,
    error: null,
  };
  uploadJobs.set(jobId, state);
  return { jobId, state };
};

jobStore.getJob = (jobId) => {
  return uploadJobs.get(jobId) || null;
};

jobStore.scheduleCleanup = (jobId) => {
  setTimeout(() => uploadJobs.delete(jobId), JOB_TTL_MS);
};

export { jobStore };
