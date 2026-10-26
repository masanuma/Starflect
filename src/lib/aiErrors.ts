import type {Lang} from './i18n'
const errors:Record<Lang,{retry:string;busy:string}>={
  ja:{retry:'返答を読み込めませんでした。少し待って、もう一度お試しください。',busy:'現在、利用が集中しているか、利用上限に達しています。時間をおいてお試しください。'},
  en:{retry:'The reply could not be loaded. Please wait a moment and try again.',busy:'The service is busy or a usage limit has been reached. Please try again later.'},
  es:{retry:'No se pudo cargar la respuesta. Espera un momento e inténtalo de nuevo.',busy:'El servicio está ocupado o se ha alcanzado un límite de uso. Inténtalo más tarde.'},
  fr:{retry:'La réponse n’a pas pu être chargée. Veuillez patienter un instant puis réessayer.',busy:'Le service est très sollicité ou une limite d’utilisation a été atteinte. Veuillez réessayer plus tard.'},
  it:{retry:'Non è stato possibile caricare la risposta. Attendi un momento e riprova.',busy:'Il servizio è occupato oppure è stato raggiunto un limite di utilizzo. Riprova più tardi.'},
  pt:{retry:'Não foi possível carregar a resposta. Aguarde um momento e tente novamente.',busy:'O serviço está ocupado ou foi atingido um limite de utilização. Tente novamente mais tarde.'},
  ko:{retry:'답변을 불러오지 못했어요. 잠시 기다린 뒤 다시 시도해 주세요.',busy:'현재 이용이 많거나 이용 한도에 도달했어요. 잠시 후 다시 시도해 주세요.'},
}
export const aiFailureMessage=(lang:Lang,status?:number)=>status===429?errors[lang].busy:errors[lang].retry
