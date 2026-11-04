// Tamaño (en píxeles) del lado de la foto de perfil tras recortarla y reducirla.
const AVATAR_SIZE = 256;
// Tamaño máximo del archivo original que se acepta.
const MAX_FILE_BYTES = 10 * 1024 * 1024;

// Convierte una imagen elegida por el usuario en un data URL JPEG cuadrado (base64) de 256x256.
// Se recorta desde el centro y se reduce para que ocupe poco al guardarse en la base de datos.
export async function fileToAvatarDataUrl(file: File): Promise<string> {
    if (!file.type.startsWith("image/")) {
        throw new Error("El archivo seleccionado no es una imagen.");
    }
    if (file.size > MAX_FILE_BYTES) {
        throw new Error("La imagen es demasiado grande (máximo 10 MB).");
    }

    let bitmap: ImageBitmap;
    try {
        bitmap = await createImageBitmap(file);
    } catch {
        throw new Error("No se ha podido leer la imagen. Prueba con un PNG, JPG o WebP.");
    }

    try {
        const side = Math.min(bitmap.width, bitmap.height);
        const sourceX = (bitmap.width - side) / 2;
        const sourceY = (bitmap.height - side) / 2;

        const canvas = document.createElement("canvas");
        canvas.width = AVATAR_SIZE;
        canvas.height = AVATAR_SIZE;
        const context = canvas.getContext("2d");
        if (!context) throw new Error("No se ha podido procesar la imagen.");

        // Fondo blanco: el JPEG no admite transparencia.
        context.fillStyle = "#ffffff";
        context.fillRect(0, 0, AVATAR_SIZE, AVATAR_SIZE);
        context.drawImage(bitmap, sourceX, sourceY, side, side, 0, 0, AVATAR_SIZE, AVATAR_SIZE);

        return canvas.toDataURL("image/jpeg", 0.85);
    } finally {
        bitmap.close();
    }
}