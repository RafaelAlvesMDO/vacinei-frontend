import { File, Paths } from 'expo-file-system';
import { ImageManipulator, SaveFormat } from 'expo-image-manipulator';

// Lado maior da foto enviada ao OCR: suficiente para ler a caderneta e bem abaixo do limite de 8 MB da API
const MAX_SIDE = 2000;
const JPEG_QUALITY = 0.8;

export interface CardPhoto {
  uri: string;
  width: number;
  height: number;
}

/**
 * Reduz a foto (lado maior de até 2000 px, JPEG 0,8) antes do envio. A cópia reduzida fica no cache do app
 * e deve ser apagada com `discardPhoto` depois do envio (LGPD)
 */
export async function preparePhoto(photo: CardPhoto): Promise<CardPhoto> {
  const context = ImageManipulator.manipulate(photo.uri);
  const largest = Math.max(photo.width, photo.height);
  if (largest > MAX_SIDE) {
    context.resize(photo.width >= photo.height ? { width: MAX_SIDE } : { height: MAX_SIDE });
  }
  const image = await context.renderAsync();
  const saved = await image.saveAsync({ compress: JPEG_QUALITY, format: SaveFormat.JPEG });
  return { uri: saved.uri, width: saved.width, height: saved.height };
}

/**
 * Apaga uma foto do cache do app (a da câmera, a cópia da galeria ou a reduzida). Falhas são ignoradas:
 * o arquivo pode já ter sido removido, e o cache do sistema também é limpo pelo próprio aparelho
 */
export function discardPhoto(uri: string | null | undefined): void {
  if (!uri) return;
  try {
    // Só arquivos do cache do app: nunca a foto original da galeria
    if (!uri.startsWith(Paths.cache.uri)) return;
    const file = new File(uri);
    if (file.exists) file.delete();
  } catch {
    // Arquivo fora do cache do app ou já apagado
  }
}
