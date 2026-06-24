import cors from 'cors';
import express from 'express';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {compositionSchemaFor, getAllTemplates} from '../../src/templates/registry';
import {renderRouter} from './routes/render';

const dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(dirname, '../..');
const port = Number.parseInt(process.env.PORT ?? '3001', 10);

const app = express();

app.use(cors());
app.use(express.json({limit: '2mb'}));
app.use('/renders', express.static(path.join(projectRoot, 'public/renders')));
app.use('/api/render', renderRouter);

const compositions = getAllTemplates().map((template) =>
  compositionSchemaFor(template.id),
);

app.get('/api/compositions', (_req, res) => {
  res.json({
    compositions,
  });
});

app.post('/api/compositions', (_req, res) => {
  res.json({
    compositions,
  });
});

app.use(
  (
    error: unknown,
    _req: express.Request,
    res: express.Response,
    _next: express.NextFunction,
  ) => {
    if (error instanceof Error) {
      res.status(500).json({error: error.message});
      return;
    }

    res.status(500).json({error: 'Unexpected server error'});
  },
);

app.listen(port, () => {
  console.info(`Vary.video API listening on http://localhost:${port}`);
});
