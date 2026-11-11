# Guía simple para subir tu parte a GitHub

## Primero, qué es cada cosa (en palabras simples)

- **Repositorio:** es la carpeta del proyecto en internet, donde todo
  el equipo guarda su trabajo.
- **Carpeta `parte-4-medicion`:** es TU carpeta dentro de ese
  repositorio. Ahí va solo lo tuyo, no lo de los demás.
- **`measurements.js`:** es el archivo con los cálculos. Es el
  trabajo que ya hicimos. Tú no tienes que escribirlo de nuevo.
- **`test.js`:** es el archivo que comprueba que los cálculos
  están bien. Solo se usa para probar.
- **`README.md`:** es un archivo de texto que explica qué hace
  tu parte, para que el jurado y tu equipo lo entiendan.

Tú no tienes que crear nada desde cero. Solo tienes que copiar
estos archivos a tu carpeta en GitHub.

## Paso 1: descarga los archivos

1. Descarga el archivo `geodrone-parte4.zip` que te mandé en el chat.
2. Búscalo en tu computadora, en la carpeta Descargas.
3. Haz clic derecho sobre él y elige "Extraer" o "Descomprimir".
4. Te va a quedar una carpeta llamada `geodrone-parte4` con
   los 3 archivos adentro.

## Paso 2: entra al repositorio en GitHub

1. Abre GitHub en tu navegador.
2. Entra al repositorio de GeoDrone (no solo al perfil del equipo).
   El link del repositorio se ve así:
   `https://github.com/Equipo-InnovAI/NOMBRE-DEL-REPO`
   Si solo ves `https://github.com/Equipo-InnovAI`, eso es el
   perfil, no el repositorio. Ahí todavía falta entrar al proyecto.
3. Si el repositorio es privado, primero tienes que iniciar sesión
   con tu cuenta de GitHub.

## Paso 3: sube tu carpeta (sin usar la terminal)

Esta es la forma más fácil, no necesitas comandos:

1. Dentro del repositorio, haz clic en el botón **"Add file"**
   y luego en **"Upload files"**.
2. Arrastra la carpeta `geodrone-parte4` a esa ventana.
   O haz clic en "choose your files" y selecciona los 3 archivos.
3. Abajo, donde dice "Commit changes", escribe algo como:
   `Agrego cálculos de medición - Parte 4`
4. Haz clic en el botón verde **"Commit changes"**.

Listo. Ya quedó tu parte guardada en GitHub.

## Paso 4: comprueba que funciona

1. En tu computadora, abre la carpeta que descomprimiste.
2. Abre una terminal en esa carpeta y escribe:
   `node test.js`
3. Debe salir un mensaje que dice que todas las pruebas pasaron.

Si no tienes Node instalado en tu computadora, no te preocupes:
ese paso lo podemos hacer después, lo importante primero es
que los archivos queden en GitHub.

## Si algo no te sale

No borres nada. Mándame una captura de pantalla de lo que ves
en GitHub y dime en qué paso te quedaste, y lo resolvemos juntos.
