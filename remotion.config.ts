import {Config} from '@remotion/cli/config';

process.env.LD_LIBRARY_PATH = [
  '/home/raymo/.local/lib-fixes/usr/lib/x86_64-linux-gnu',
  process.env.LD_LIBRARY_PATH,
]
  .filter(Boolean)
  .join(':');

Config.setVideoImageFormat('jpeg');
Config.setCodec('h264');
Config.setOverwriteOutput(true);
