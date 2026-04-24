import { Router } from 'express';
import { extractAttributes, generatePersona, getEmbedding } from '../clients';

const testRoutes = Router();

testRoutes.get('/facellm', async (_req, res) => {
  try {
    console.log('[TestRoute][FaceLLM] Building dummy image buffer');
    const dummyImage = Buffer.from('dummy-image-content', 'utf-8');

    console.log('[TestRoute][FaceLLM] Calling extractAttributes');
    const attributes = await extractAttributes(dummyImage);

    console.log('[TestRoute][FaceLLM] Successfully received attributes');
    res.status(200).json({
      success: true,
      data: attributes,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('[TestRoute][FaceLLM] Failed:', error);
    res.status(500).json({
      success: false,
      message,
    });
  }
});

testRoutes.get('/embed', async (_req, res) => {
  try {
    console.log('[TestRoute][Embedding] Calling getEmbedding("black")');
    const embedding = await getEmbedding('black');

    console.log('[TestRoute][Embedding] Successfully received embedding');
    res.status(200).json({
      success: true,
      data: embedding,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('[TestRoute][Embedding] Failed:', error);
    res.status(500).json({
      success: false,
      message,
    });
  }
});

testRoutes.get('/lego', async (_req, res) => {
  try {
    const mockModules = {
    "persona": {
        "beard": "no_beard",
        "eyebrows": "black_round_eyebrows",
        "eyes": "brown_eyes",
        "hair": "bald_hair",
        "nose": "round_nose",
        "pants": "blue_pants",
        "shirt": "red_shirt",
    }
};

    console.log('[TestRoute][Lego] Calling generatePersona with mock modules', mockModules);
    const legoResult = await generatePersona(mockModules as never);

    console.log('[TestRoute][Lego] Successfully received Lego response');
    res.status(200).json({
      success: true,
      data:
        typeof legoResult === 'string'
          ? { type: 'url', value: legoResult }
          : { type: 'base64', value: legoResult.toString('base64'), encoding: 'base64' },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('[TestRoute][Lego] Failed:', error);
    res.status(500).json({
      success: false,
      message,
    });
  }
});

export default testRoutes;
