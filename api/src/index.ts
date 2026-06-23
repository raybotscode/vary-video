import cors from 'cors';
import express from 'express';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {insuranceAdCompositionSchema} from '../../src/compositions';
import {renderRouter} from './routes/render';

const dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(dirname, '../..');
const port = Number.parseInt(process.env.PORT ?? '3001', 10);

const app = express();

app.use(cors());
app.use(express.json({limit: '2mb'}));
app.use('/renders', express.static(path.join(projectRoot, 'public/renders')));
app.use('/api/render', renderRouter);

app.post('/api/compositions', (_req, res) => {
  res.json({
    compositions: [insuranceAdCompositionSchema],
  });
});

app.use(
  (
    error: unknown,
    _req: express.Request,
    res: express.Response,
    _next: express.NextFunction,
  ) => {
    const message =
      error instanceof Error ? error.message : 'Unexpected server error';
    res.status(500).json({error: message});
  },
);

app.listen(port, () => {
  console.info(`Vary.video API listening on http://localhost:${port}`);
});
