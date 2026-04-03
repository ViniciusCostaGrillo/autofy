# Play Store Release Checklist

## Build Identity

- Confirmar `android.package`: `com.viniciuscostagrillo.autofy`
- Confirmar `android.versionCode` incremental antes de cada envio
- Confirmar `expo.version` para a versao publica do app
- Gerar `AAB` com `eas build --platform android --profile production`

## Secrets e Backend

- Definir `OPENROUTESERVICE_API_KEY` no Supabase
- Definir `APP_ORIGIN` no Supabase se houver uso web
- Confirmar que `route-estimate` e `route-places` estao deployadas
- Confirmar que chaves e tokens nao existem em arquivos versionados

## Seguranca

- Validar que o botao de `admin de teste` nao aparece em build de producao
- Validar login por OTP real
- Validar login por senha real
- Validar logout e expiracao de sessao
- Revisar politicas RLS no Supabase antes do envio
- Confirmar que logs locais de desenvolvimento nao sao persistidos em release

## Android Release

- Subir o `.aab` gerado na Google Play Console
- Preencher `Data safety`
- Informar politica de privacidade publica
- Revisar classificacao etaria, contato e capturas de tela
- Preencher ficha da loja e email de suporte

## Verificacao Final

- Rodar `npm run typecheck`
- Rodar `npx expo-doctor`
- Rodar `npx expo export --platform android`
- Testar fluxo completo em build release interna
- Validar login, onboarding, viagem, abastecimento, manutencoes e logout em build release
