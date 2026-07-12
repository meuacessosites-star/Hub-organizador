# Manual de Publicação - Hub Organizado (Android)

Este projeto está configurado para publicação na Google Play Store.

## 🚀 Como Publicar na Google Play

1. **Exportar o Código**: Use a opção **"Exportar para ZIP"** ou **"GitHub"** no menu do AI Studio.
2. **Abrir no Android Studio**: Selecione a pasta `android/`.
3. **Gerar Chave de Assinatura (Keystore)**:
   - Vá em `Build` > `Generate Signed Bundle / APK`.
   - Escolha `Android App Bundle`.
   - Crie uma nova `Key store path` (guarde este arquivo e a senha, você precisará deles para atualizações).
4. **Configurar o Firebase**:
   - No Console do Firebase, crie um app Android com o pacote `com.huborganizado.app`.
   - Gere o arquivo `google-services.json` e coloque-o em `android/app/`.
   - Adicione a sua **SHA-1** (gerada no passo anterior) nas configurações do app no Firebase para habilitar o login.
5. **Ícone**: O Android Studio pode gerar os ícones automáticos a partir do `/public/icon.jpg` usando a ferramenta `Image Asset`.

## 🛠️ Tecnologias Utilizadas
- **Linguagem**: Kotlin
- **UI**: Jetpack Compose (Moderno e Fluido)
- **Backend**: Firebase Firestore (Seguro e Escalável)
- **Tema**: Indigo & Charcoal Premium

