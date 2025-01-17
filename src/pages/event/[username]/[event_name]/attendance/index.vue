<template>
  <Loader :api="api" indicator="ping">
    <div class="flex flex-col gap-4">
      <LayoutBreadcrumbs
        :prefixes="[
          { name: t('events'), to: localePath('/event') },
          {
            name: routeParamUsername,
            to: localePath(`/event/${route.params.username}`),
          },
          {
            name: routeParamEventName,
            to: localePath(
              `/event/${route.params.username}/${route.params.event_name}`,
            ),
          },
        ]"
      >
        {{ t('checkIns') }}
      </LayoutBreadcrumbs>
      <h1>
        {{ t('title') }}
      </h1>
      <Steps
        :active="t('qrCodeScan')"
        :steps="[t('qrCodeScan'), t('nfcWrite')]"
      />
      <Hr />
      <div class="flex flex-col items-center justify-center gap-4">
        <ButtonColored :aria-label="t('qrCodeScan')" @click="qrCodeScan">
          {{ t('qrCodeScan') }}
          <template #prefix>
            <IconQrCode />
          </template>
        </ButtonColored>
        <FormInputStateInfo v-if="!invitationId">
          {{ t('qrHint') }}
        </FormInputStateInfo>
        <CardStateInfo v-if="invitationId">
          {{ t('scanned', { scanResult: invitationId }) }}
        </CardStateInfo>
        <div v-if="invitationId" class="flex flex-col items-center gap-2">
          <ButtonColored
            :aria-label="t('nfcWrite')"
            :disabled="isNfcError"
            class="text-text-bright"
            @click="onClick"
          >
            {{ t('nfcWrite') }}
            <template #prefix>
              <IconUserTag />
            </template>
          </ButtonColored>
          <CardStateAlert v-if="isNfcError">
            {{ isNfcWritableErrorMessage }}
          </CardStateAlert>
        </div>
      </div>
      <Modal id="ModalAttendanceScanQrCode" :submit-name="t('close')">
        <QrCodeStream
          @detect="onDetect"
          @error="onError"
          @camera-on="onCameraOn"
        >
          <div v-if="loading" class="text-center">
            {{ t('globalLoading') }}
          </div>
        </QrCodeStream>
        <template #submit-icon>
          <IconXCircle />
        </template>
      </Modal>
    </div>
  </Loader>
</template>

<script setup lang="ts">
import { consola } from 'consola'
import { type DetectedBarcode } from 'barcode-detector'

import { useMaevsiStore } from '~/store'
import { useEventByAuthorAccountIdAndSlugQuery } from '~/gql/documents/queries/event/eventByAuthorAccountIdAndSlug'
import { getEventItem } from '~/gql/documents/fragments/eventItem'
import { useAccountByUsernameQuery } from '~/gql/documents/queries/account/accountByUsername'
import { getAccountItem } from '~/gql/documents/fragments/accountItem'

definePageMeta({
  async validate(route) {
    const store = useMaevsiStore()

    await validateEventExistence(route)

    // TODO: extract to permission service
    if (route.params.username !== store.signedInUsername) {
      return abortNavigation({ statusCode: 403 })
    }

    return true
  },
})

const { t } = useI18n()
const localePath = useLocalePath()
const store = useMaevsiStore()
const route = useRoute()
const fireAlert = useFireAlert()

// api data
const accountByUsernameQuery = await useAccountByUsernameQuery({
  username: route.params.username as string,
})
const accountId = computed(
  () =>
    getAccountItem(accountByUsernameQuery.data.value?.accountByUsername)?.id,
)
const eventQuery = await useEventByAuthorAccountIdAndSlugQuery({
  authorAccountId: accountId,
  slug: route.params.event_name as string,
})
const event = computed(() =>
  getEventItem(eventQuery.data.value?.eventByAuthorAccountIdAndSlug),
)
const api = getApiData([accountByUsernameQuery, eventQuery])

// data
const invitationId = ref<string>()
const isNfcWritableErrorMessage = ref<string>()
const loading = ref(true)
const routeParamEventName = route.params.event_name as string
const routeParamUsername = route.params.username as string

// computations
const isNfcError = computed(() => {
  return !!(
    isNfcWritableErrorMessage.value &&
    isNfcWritableErrorMessage.value !== 'prompt'
  )
})
const title = computed(() => {
  if (!event.value) return t('title')

  return `${t('title')} · ${event.value.name}`
})

// methods
const qrCodeScan = () => {
  store.modals.push({ id: 'ModalAttendanceScanQrCode' })
}
const onCameraOn = () => {
  loading.value = false
}
const onError = async (error: any) => {
  let errorMessage: string = error.message

  if (error.name === 'NotAllowedError') {
    errorMessage = t('errorCameraNotAllowed', {
      hintBrowserSettings: t('hintBrowserSettings'),
    }) as string
  } else if (error.name === 'NotFoundError') {
    errorMessage = t('errorCameraNotFound') as string
  } else if (error.name === 'NotSupportedError') {
    errorMessage = t('errorCameraNotSupported') as string
  } else if (error.name === 'NotReadableError') {
    errorMessage = t('errorCameraNotReadable') as string
  } else if (error.name === 'OverconstrainedError') {
    errorMessage = t('errorCameraOverconstrained') as string
  } else if (error.name === 'StreamApiNotSupportedError') {
    errorMessage = t('errorCameraStreamApiNotSupported') as string
  }

  await fireAlert({ level: 'error', text: errorMessage })
  store.modalRemove('ModalAttendanceScanQrCode')
  consola.error(errorMessage)
}
const onClick = async () => {
  await writeTag(invitationId.value)
}
const onDetect = async (e: DetectedBarcode[]) => {
  invitationId.value = e[0].rawValue
  await fireAlert({ level: 'success' })
  store.modalRemove('ModalAttendanceScanQrCode')
}
const checkWriteTag = async () => {
  if (!('NDEFReader' in window)) {
    return Promise.reject(
      Error(
        t('errorNfcNotSupported', {
          hintUpdateOrChrome: t('hintUpdateOrChrome'),
        }) as string,
      ),
    )
  }

  if (!navigator.permissions) {
    return Promise.reject(
      Error(
        t('errorNavigatorPermissionsNotSupported', {
          hintUpdateOrChrome: t('hintUpdateOrChrome'),
        }) as string,
      ),
    )
  } else {
    const nfcPermissionStatus = await navigator.permissions.query({
      name: 'nfc' as PermissionName,
    })

    if (nfcPermissionStatus.state === 'granted') {
      return Promise.resolve()
    } else {
      return Promise.reject(Error(nfcPermissionStatus.state))
    }
  }
}
const writeTag = async (e: any) => {
  try {
    await new NDEFReader().write(e)
    await fireAlert({ level: 'success' })
  } catch (error) {
    if (error instanceof DOMException) {
      let errorMessage: string = error.message

      if (error.name === 'AbortError') {
        errorMessage = t('errorNfcAbort', {
          hintTryAgain: t('hintTryAgain'),
        }) as string
      } else if (error.name === 'NotAllowedError') {
        errorMessage = t('errorNfcNotAllowed', {
          hintBrowserSettings: t('hintBrowserSettings'),
        }) as string
      } else if (error.name === 'NotSupportedError') {
        errorMessage = t('errorNfcNotSupported') as string
      } else if (error.name === 'NotReadableError') {
        errorMessage = t('errorNfcNotReadable') as string
      } else if (error.name === 'NetworkError') {
        errorMessage = t('errorNfcNetwork', {
          hintTryAgain: t('hintTryAgain'),
        }) as string
      }

      await fireAlert({ level: 'error', text: errorMessage })
      consola.error(errorMessage)
    } else {
      alert(`Unexpected error: ${error}`)
    }
  }
}

// lifecycle
onMounted(() => {
  checkWriteTag().catch((err: Error) => {
    isNfcWritableErrorMessage.value = err.message
  })
})

// initialization
useHeadDefault({ title })
</script>

<script lang="ts">
export default {
  components: {
    QrCodeStream: defineAsyncComponent(
      async () => (await import('vue-qrcode-reader')).QrcodeStream,
    ),
  },
}
</script>

<i18n lang="yaml">
de:
  checkIns: Check-in
  close: Schließen
  errorCameraNotAllowed: Berechtigung zum Kamerazugriff fehlt. {hintBrowserSettings}
  errorCameraNotFound: Konnte keine geeignete Kamera finden.
  errorCameraNotReadable: Zugriff auf die Kamera nicht möglich. Wird sie von einem anderen Programm verwendet?
  errorCameraNotSupported: Die Webseite wird nicht über eine sichere Verbindung geladen.
  errorCameraOverconstrained: Frontkamerazugriff ist nicht möglich.
  errorCameraStreamApiNotSupported: Der Browser unterstützt den Zugriff auf Videostreams nicht.
  errorNavigatorPermissionsNotSupported: Navigator-Berechtigungen werden nicht unterstützt! {hintUpdateOrChrome}
  errorNfcAbort: Der NFC-Scan wurde unterbrochen! {hintTryAgain}
  errorNfcNetwork: Die NFC-Übertragung wurde unterbrochen! {hintTryAgain}
  errorNfcNotAllowed: Berechtigung zum NFC-Zugriff fehlt! {hintBrowserSettings}
  errorNfcNotReadable: Zugriff auf den NFC-Adapter nicht möglich. Wird er von einem anderen Programm verwendet?
  errorNfcNotSupported: Es wurde kein kompatibler NFC-Adapter gefunden. {hintUpdateOrChrome}
  events: Veranstaltungen
  hintBrowserSettings: Sieh in deinen Browser-Einstellungen nach.
  hintUpdateOrChrome: Versuche deinen Browser zu aktualisieren oder Google Chrome zu verwenden.
  hintTryAgain: Versuch es noch einmal.
  nfcWrite: NFC-Tag schreiben
  qrCodeScan: Check-in-Code scannen
  qrHint: Lass dir von Gästen den QR-Code auf ihrer Einladungsseite zeigen
  scanned: 'Gescannt: {scanResult}'
  title: Check-in
en:
  checkIns: check in
  close: Close
  errorCameraNotAllowed: Need camera access permissons.
  errorCameraNotFound: Could not find a suitable camera.
  errorCameraNotReadable: Could not access camera. Is it in use by another program right now?
  errorCameraNotSupported: The web page is not loaded over a secure connection.
  errorCameraOverconstrained: Could not access front camera.
  errorCameraStreamApiNotSupported: Your browser does not support access to video streams.
  errorNavigatorPermissionsNotSupported: Navigator permissions are not supported! {hintUpdateOrChrome}
  errorNfcAbort: The NFC scan was interrupted! {hintTryAgain}
  errorNfcNetwork: The NFC transmission was interrupted! {hintTryAgain}
  errorNfcNotAllowed: Need NFC access permission! {hintBrowserSettings}
  errorNfcNotReadable: Could not access NFC adapter. Is it in use by another program right now?
  errorNfcNotSupported: No compatible NFC adapter was found. {hintUpdateOrChrome}
  events: events
  hintBrowserSettings: Check your browser settings.
  hintUpdateOrChrome: Try updating your browser or use Google Chrome.
  hintTryAgain: Try again.
  nfcWrite: Write to NFC tag
  qrCodeScan: Scan check in code
  qrHint: Ask guests to show you the QR code on their invitation page
  scanned: 'Scanned: {scanResult}'
  title: Check in
</i18n>
