import { Factory, SupplyLink, CargoStatus } from '../types';
import { buildRoutePoints, buildRouteParallelIndex, pointOnRoute } from '../utils/mapRoutes';
import { mapCargoTypeToProductId } from '../constants/products';
import { inferFlowType } from '../utils/flowType';
import { applyOurSitesToFactories } from './ourSites';

// Helper to extract clean site ID from RefLink string
export function cleanRefId(refStr: string): string {
  if (!refStr) return '';
  if (refStr.startsWith('RefLink(')) {
    const match = refStr.match(/,\s*([A-Za-z0-9_-]+marke)\)/);
    if (match && match[1]) {
      return match[1];
    }
    // Fallback: try taking last comma separated part
    const parts = refStr.split(/,\s*/);
    if (parts.length > 1) {
      const last = parts[parts.length - 1];
      return (last ?? '').replace(')', '').trim();
    }
  }
  return refStr;
}

const _baseFactories: Factory[] = [
  {"id":"N9iuJ1X5wi3gO2bmNJd0marke","name":"Томинский ГОК","type":"gok","latitude":54.95,"longitude":61.3,"region":"Челябинская область","country":"РФ","is_ours":false,"description":"Медный концентрат","holding":""},
  {"id":"aeBiW9Jy76kPzTcxuIc0marke","name":"Удоканский ГОК","type":"gok","latitude":56.28,"longitude":118.27,"region":"Забайкальский край","country":"РФ","is_ours":false,"description":"Медный концентрат","holding":""},
  {"id":"mVRk9SVv3Vqv4BDVTP30marke","name":"Кольский Апатит","type":"gok","latitude":67.61,"longitude":33.67,"region":"Мурманская область","country":"РФ","is_ours":false,"description":"Апатитовый концентрат","holding":""},
  {"id":"jYcmdmplPWXkxr6vNEo0marke","name":"ГОК Олений ручей","type":"gok","latitude":67.8,"longitude":33.2,"region":"Мурманская область","country":"РФ","is_ours":false,"description":"Апатитовый концентрат","holding":"Группа Акрон"},
  {"id":"h8txBSHWLwr5bqc4q0I0marke","name":"Кимкано-Сутарский ГОК","type":"gok","latitude":48.8,"longitude":132,"region":"Еврейская АО","country":"РФ","is_ours":false,"description":"Железорудный концентрат","holding":""},
  {"id":"w6BT7dYbmJiKnulnMIl0marke","name":"Таштагольский ГОК","type":"gok","latitude":52.75,"longitude":87.85,"region":"Кемеровская область","country":"РФ","is_ours":false,"description":"Железная руда","holding":""},
  {"id":"aAbRVNhPcyPRIdM5Uib0marke","name":"Беларуськалий","type":"gok","latitude":52.77,"longitude":27.55,"region":"Минская область","country":"Беларусь","is_ours":false,"description":"Калийные соли","holding":"Беларуськалий"},
  {"id":"7kwMC305g0oHOoSt9oA0marke","name":"Донской ГОК","type":"gok","latitude":50.3,"longitude":57.2,"region":"Актюбинская область","country":"Казахстан","is_ours":false,"description":"Хромовые концентраты","holding":""},
  {"id":"iPs7HLgNXh7j7QDRDxi0marke","name":"Соколовско-Сарбайское ГОПО","type":"gok","latitude":52.97,"longitude":63.13,"region":"Костанайская область","country":"Казахстан","is_ours":false,"description":"Железная руда","holding":""},
  {"id":"UJNEithGwyeBHEa2qVV0marke","name":"Баимский ГОК","type":"gok","latitude":69.6,"longitude":170,"region":"Чукотский АО","country":"РФ","is_ours":false,"description":"Медная руда","holding":""},
  {"id":"0WkWb5HcSErY9AJGx9u0marke","name":"Алмалыкский ГМК","type":"gok","latitude":40.85,"longitude":69.6,"region":"Ташкентская область","country":"Узбекистан","is_ours":false,"description":"Медь, золото, серебро, цинк","holding":""},
  {"id":"R6ZLZXGGTpHBgLSGzxt0marke","name":"Новороссийский порт","type":"port","latitude":44.72,"longitude":37.78,"region":"Краснодарский край","country":"РФ","is_ours":false,"description":"Морской торговый порт","holding":""},
  {"id":"SwNj2LQ1zHyfzyPFk7l0marke","name":"Санкт-Петербургский порт","type":"port","latitude":59.88,"longitude":30.22,"region":"Санкт-Петербург","country":"РФ","is_ours":false,"description":"Морской торговый порт","holding":""},
  {"id":"jbeWEWvdIAStV7kjAV20marke","name":"Мурманский порт","type":"port","latitude":68.97,"longitude":33.08,"region":"Мурманская область","country":"РФ","is_ours":false,"description":"Морской порт","holding":""},
  {"id":"pCbiM1QX4iWMsw2wLE80marke","name":"Владивостокский порт","type":"port","latitude":43.1,"longitude":131.9,"region":"Приморский край","country":"РФ","is_ours":false,"description":"Морской торговый порт","holding":""},
  {"id":"n0yFrYDjNYju2ziL0iB0marke","name":"Восточный порт","type":"port","latitude":42.73,"longitude":133.08,"region":"Приморский край","country":"РФ","is_ours":false,"description":"Морской порт (п. Врангель)","holding":""},
  {"id":"ZSPmswVoA37SYWhVEhA0marke","name":"Порт Усть-Луга","type":"port","latitude":59.67,"longitude":28.3,"region":"Ленинградская область","country":"РФ","is_ours":false,"description":"Морской торговый порт","holding":""},
  {"id":"E1v05VvcCjDIz1yMdze0marke","name":"Архангельский порт","type":"port","latitude":64.55,"longitude":40.53,"region":"Архангельская область","country":"РФ","is_ours":false,"description":"Морской порт","holding":""},
  {"id":"vv1VwQmm4PwAyvuHxIQ0marke","name":"Калуга (Уралвтормет)","type":"steel_mill","latitude":54.52,"longitude":36.25,"region":"Калужская область","country":"РФ","is_ours":false,"description":"Переработка лома","holding":""},
  {"id":"YFgsGkFdtBeLTGQPy7U0marke","name":"Тула (Уралвтормет)","type":"steel_mill","latitude":54.18,"longitude":37.6,"region":"Тульская область","country":"РФ","is_ours":false,"description":"Переработка лома","holding":""},
  {"id":"901yVhUYyirMQCYhcwY0marke","name":"Липецк (Даниил-трейдер)","type":"steel_mill","latitude":52.6,"longitude":39.6,"region":"Липецкая область","country":"РФ","is_ours":false,"description":"Трейдер скрапа","holding":""},
  {"id":"od2Ya9705rE7DcOxr6Z0marke","name":"Пермь (Александр-трейдер)","type":"steel_mill","latitude":58,"longitude":56.23,"region":"Пермский край","country":"РФ","is_ours":false,"description":"Трейдер скрапа","holding":""},
  {"id":"jH3IXI7ALXEkuUJNXYw0marke","name":"Лысьва (Тройка Мет)","type":"steel_mill","latitude":58.1,"longitude":57.8,"region":"Пермский край","country":"РФ","is_ours":false,"description":"Трейдер","holding":""},
  {"id":"nQ44CySvaLCuHlE35PT0marke","name":"Краснодар (скрап)","type":"steel_mill","latitude":45.04,"longitude":38.98,"region":"Краснодарский край","country":"РФ","is_ours":false,"description":"Приём скрапа","holding":""},
  {"id":"sKL6yYQuvUB7iS1L0xH0marke","name":"Челябинск (Вторресурс)","type":"steel_mill","latitude":55.16,"longitude":61.4,"region":"Челябинская область","country":"РФ","is_ours":false,"description":"Переработка лома","holding":""},
  {"id":"CqwMU6BCaUnXJRBvkmW0marke","name":"ГК Чермет","type":"steel_mill","latitude":55.16,"longitude":61.4,"region":"Челябинская область","country":"РФ","is_ours":false,"description":"Металлургический завод","holding":""},
  {"id":"Mmwv6Z9bJievOREvpSP0marke","name":"Новосибирский МЗ им. Кузьмина","type":"steel_mill","latitude":55.03,"longitude":82.92,"region":"Новосибирская область","country":"РФ","is_ours":false,"description":"Листовой прокат, трубы","holding":""},
  {"id":"r4d9qds8q1u3XwE7FCU0marke","name":"Таганрогский МЗ","type":"steel_mill","latitude":47.25,"longitude":38.9,"region":"Ростовская область","country":"РФ","is_ours":false,"description":"Трубы обсадные, бурильные","holding":""},
  {"id":"oibHonkvM6vucbytNDm0marke","name":"Волжский трубный завод","type":"steel_mill","latitude":48.78,"longitude":44.73,"region":"Волгоградская область","country":"РФ","is_ours":false,"description":"Трубы стальные","holding":""},
  {"id":"JQaezvM9kxCsUa3j4N20marke","name":"Тулачермет","type":"steel_mill","latitude":54.18,"longitude":37.6,"region":"Тульская область","country":"РФ","is_ours":false,"description":"Товарный чугун","holding":""},
  {"id":"eZTcHFCijYb5PusNglV0marke","name":"Белорусский МЗ (БМЗ, Жлобин)","type":"steel_mill","latitude":52.88,"longitude":30.03,"region":"Гомельская область","country":"Беларусь","is_ours":false,"description":"Арматура, катанка, трубы, металлокорд","holding":"БМК"},
  {"id":"3NQIz9yLRgr6brv4OWF0marke","name":"Золошлаковый отвал Иркутскэнерго","type":"slag_dump","latitude":52.28,"longitude":104.28,"region":"Иркутская область","country":"РФ","is_ours":false,"description":"Золошлаковые отходы","holding":"Иркутскэнерго"},
  {"id":"FDq9FxDDUSGZFrJW7hs0marke","name":"Отвал БМЗ (Жлобин)","type":"slag_dump","latitude":52.88,"longitude":30.03,"region":"Гомельская область","country":"Беларусь","is_ours":false,"description":"Сталеплавильные и доменные шлаки","holding":"БМЗ"},
  {"id":"xDS1bMNkaqhscljgDz90marke","name":"Отвал АрселорМиттал Кривой Рог","type":"slag_dump","latitude":47.9,"longitude":33.35,"region":"Днепропетровская область","country":"Украина","is_ours":false,"description":"Доменные и сталеплавильные шлаки","holding":"ArcelorMittal"},
  {"id":"aQOWlcH4hpZYSUfRL1M0marke","name":"НЛМК (Новолипецкий мет. комбинат)","type":"steel_mill","latitude":52.6,"longitude":39.6,"region":"Липецкая область","country":"РФ","is_ours":true,"description":"Чугун, сталь, прокат, оцинковка","holding":"НЛМК"},
  {"id":"KGB8y4jrPdHdg1eGD7j0marke","name":"Череповецкий МК (Северсталь)","type":"steel_mill","latitude":59.12,"longitude":37.9,"region":"Вологодская область","country":"РФ","is_ours":false,"description":"Сортовой и листовой прокат","holding":"Северсталь"},
  {"id":"ixqnCXWImEoTNQyX3Wp0marke","name":"Магнитогорский МК (ММК)","type":"steel_mill","latitude":53.42,"longitude":58.98,"region":"Челябинская область","country":"РФ","is_ours":false,"description":"Сортовой прокат, лист, трубы","holding":"ММК"},
  {"id":"VJWB4m6QRNbWxHyFnsV0marke","name":"Стойленский ГОК","type":"gok","latitude":51.3,"longitude":37.83,"region":"Белгородская область","country":"РФ","is_ours":false,"description":"Железная руда","holding":"Стойленский"},
  {"id":"PjvXVmJFB3f6Aecj33i0marke","name":"Быстринский ГОК","type":"gok","latitude":52.03,"longitude":113.5,"region":"Забайкальский край","country":"РФ","is_ours":false,"description":"Магнетитовый, медный, золотой концентрат","holding":""},
  {"id":"lnJmNtn9KYrxRY5FG8A0marke","name":"Астраханский порт","type":"port","latitude":46.35,"longitude":47.98,"region":"Астраханская область","country":"РФ","is_ours":false,"description":"Морской и речной порт","holding":""},
  {"id":"RmvuAac1roRuASNemz00marke","name":"Порт Сабетта","type":"port","latitude":71.28,"longitude":72.05,"region":"ЯНАО","country":"РФ","is_ours":false,"description":"Морской порт (СПГ)","holding":""},
  {"id":"9XeuAp6dlCeSJ4S71Rk0marke","name":"Морской порт Тамань","type":"port","latitude":45.2,"longitude":36.73,"region":"Краснодарский край","country":"РФ","is_ours":false,"description":"Морской порт","holding":""},
  {"id":"xM1LPiBXSjSkHWyGuPi0marke","name":"Михеевский ГОК","type":"gok","latitude":53.7,"longitude":60.7,"region":"Челябинская область","country":"РФ","is_ours":false,"description":"Концентрат меди","holding":""},
  {"id":"Lrk5f8p1QRYgm9jliZD0marke","name":"Навоийский ГМК","type":"gok","latitude":40.08,"longitude":65.38,"region":"Навоийская область","country":"Узбекистан","is_ours":false,"description":"Золото","holding":""},
  {"id":"VTwL98RSzcYX5v6qwkQ0marke","name":"Зангезурский медно-молибденовый комбинат","type":"gok","latitude":39.15,"longitude":46.03,"region":"Сюникская область","country":"Армения","is_ours":false,"description":"Молибденовый и медный концентрат","holding":""},
  {"id":"okNu0Kj1oHw908eku0B0marke","name":"Приморский порт","type":"port","latitude":60.35,"longitude":28.7,"region":"Ленинградская область","country":"РФ","is_ours":false,"description":"Морской порт","holding":""},
  {"id":"Q3gAzwWpBo8iN1g6B9f0marke","name":"Ванинский порт","type":"port","latitude":49.08,"longitude":140.27,"region":"Хабаровский край","country":"РФ","is_ours":false,"description":"Морской торговый порт","holding":""},
  {"id":"XbfAOyR8eXtOFJcyq000marke","name":"Калининградский порт","type":"port","latitude":54.7,"longitude":20.5,"region":"Калининградская область","country":"РФ","is_ours":false,"description":"Морской торговый порт","holding":""},
  {"id":"sWl9fb9ScVEd6oLxrRx0marke","name":"Магаданский порт","type":"port","latitude":59.57,"longitude":150.8,"region":"Магаданская область","country":"РФ","is_ours":false,"description":"Морской порт «Ворота Колымы»","holding":""},
  {"id":"mrWvJe6c8lSOz2fK3e40marke","name":"Ростовский порт","type":"port","latitude":47.22,"longitude":39.7,"region":"Ростовская область","country":"РФ","is_ours":false,"description":"Морской порт","holding":""},
  {"id":"fgsHegI3G1c9W0kaadY0marke","name":"Новосибирск (Втормет)","type":"steel_mill","latitude":55.03,"longitude":82.92,"region":"Новосибирская область","country":"РФ","is_ours":false,"description":"Переработка лома","holding":""},
  {"id":"vsJbuuTqw4YXnWIe93u0marke","name":"Пашия (Пермский край)","type":"steel_mill","latitude":58.42,"longitude":58.27,"region":"Пермский край","country":"РФ","is_ours":false,"description":"Металлургическое производство","holding":""},
  {"id":"dwWSEvm6fNRXZFDHb8Y0marke","name":"Омский порт","type":"port","latitude":55,"longitude":73.37,"region":"Омская область","country":"РФ","is_ours":false,"description":"Речной порт","holding":""},
  {"id":"lLrm3uGP8lIqBtjNqzh0marke","name":"Шахта Казахстанская","type":"coal_mine","latitude":49.82,"longitude":73.15,"region":"Карагандинская область","country":"Казахстан","is_ours":false,"description":"Каменный уголь","holding":"Qarmet"},
  {"id":"d5AiLuDBlNe0IlCH24z0marke","name":"Порт Баку","type":"port","latitude":40.3,"longitude":49.85,"region":"Апшеронский полуостров","country":"Азербайджан","is_ours":false,"description":"Международный морской порт","holding":""},
  {"id":"KISGElgo9I7cKndUEAf0marke","name":"Порт Туркменбаши","type":"port","latitude":40.02,"longitude":52.97,"region":"Балканский велаят","country":"Туркменистан","is_ours":false,"description":"Международный морской порт","holding":""},
  {"id":"rXP6bpAk6P5ficeSK2s0marke","name":"Шахта им. Костенко","type":"coal_mine","latitude":49.8,"longitude":73.12,"region":"Карагандинская область","country":"Казахстан","is_ours":false,"description":"Каменный уголь (коксующийся)","holding":"Qarmet"},
  {"id":"lHbXKFL5IaYs2eVNrA20marke","name":"Отвал ММК (Магнитогорск)","type":"slag_dump","latitude":53.42,"longitude":58.98,"region":"Челябинская область","country":"РФ","is_ours":false,"description":"Доменные шлаки","holding":"ММК"},
  {"id":"xSPz1lRgxbz8cqfTCVb0marke","name":"Отвал ЧМК (Челябинск)","type":"slag_dump","latitude":55.16,"longitude":61.4,"region":"Челябинская область","country":"РФ","is_ours":false,"description":"Доменные шлаки","holding":"ЧМК"},
  {"id":"aLK2UJcVTPjA5HkEz9c0marke","name":"Отвал Норильский комбинат","type":"slag_dump","latitude":69.33,"longitude":88.22,"region":"Красноярский край","country":"РФ","is_ours":false,"description":"Никелевые шлаки","holding":"Норникель"},
  {"id":"z7mpiVE5unxoI19UVcY0marke","name":"Отвал Казахмыс (Балхаш)","type":"slag_dump","latitude":46.85,"longitude":74.97,"region":"Карагандинская область","country":"Казахстан","is_ours":false,"description":"Медные шлаки","holding":"Казахмыс"},
  {"id":"xk7ujNlXVAc49C1dvYM0marke","name":"Ашинский метзавод","type":"steel_mill","latitude":54.99,"longitude":57.27,"region":"Челябинская область","country":"РФ","is_ours":false,"description":"Черный металлопрокат","holding":""},
  {"id":"7dur8DgcU9QQdM3ZKyb0marke","name":"Чусовской металлургический завод (ЧМЗ)","type":"steel_mill","latitude":58.28,"longitude":57.81,"region":"Пермский край","country":"РФ","is_ours":true,"description":"Трубы, прокат, колёса, рессоры","holding":"ЧМЗ"},
  {"id":"CPETqoih6u4rMKIfS9Q0marke","name":"Уральская Сталь (Новотроицк)","type":"steel_mill","latitude":51.2,"longitude":58.3,"region":"Оренбургская область","country":"РФ","is_ours":false,"description":"Чугун, сталь, прокат, мостосталь","holding":""},
  {"id":"5QVykD1QgCoKlaYKYRs0marke","name":"Ижсталь (Ижевск)","type":"steel_mill","latitude":56.85,"longitude":53.22,"region":"Удмуртия","country":"РФ","is_ours":false,"description":"Специальные марки стали","holding":""},
  {"id":"eCZyOt1ta9EDZ75OPiM0marke","name":"АрселорМиттал Темиртау","type":"steel_mill","latitude":50.07,"longitude":72.97,"region":"Карагандинская область","country":"Казахстан","is_ours":false,"description":"Чугун, сталь, прокат","holding":"ArcelorMittal"},
  {"id":"OMJfx0SONWSdSy38bDp0marke","name":"Baku Steel Company","type":"steel_mill","latitude":40.58,"longitude":49.63,"region":"Сумгаит","country":"Азербайджан","is_ours":false,"description":"Арматура, балки, уголок","holding":""},
  {"id":"Ki0TsXNCmfSO1NvjTRy0marke","name":"Узметкомбинат (Бекабад)","type":"steel_mill","latitude":40.22,"longitude":69.22,"region":"Ташкентская область","country":"Узбекистан","is_ours":false,"description":"Чугун, сталь, прокат","holding":""},
  {"id":"MemdghGzW4O1Yv3K2LX0marke","name":"ВИЗ-Сталь (Екатеринбург)","type":"steel_mill","latitude":56.83,"longitude":60.58,"region":"Свердловская область","country":"РФ","is_ours":false,"description":"Трансформаторная сталь","holding":""},
  {"id":"pSif7sepLzmC2bJNnbt0marke","name":"Красноярский МЗ (КраМЗ)","type":"steel_mill","latitude":56.01,"longitude":92.85,"region":"Красноярский край","country":"РФ","is_ours":false,"description":"Алюминиевые профили и слитки","holding":""},
  {"id":"PBQUYI7bMtSaJQ5RsNc0marke","name":"Гайский ГОК","type":"gok","latitude":51.47,"longitude":58.45,"region":"Оренбургская область","country":"РФ","is_ours":false,"description":"Медный, цинковый концентрат","holding":""},
  {"id":"SLz5OHracZPVU4XVPxi0marke","name":"Учалинский ГОК","type":"gok","latitude":54.32,"longitude":59.42,"region":"Башкортостан","country":"РФ","is_ours":false,"description":"Концентрат меди, цинка","holding":""},
  {"id":"qJMgjBUrx9MANAW2syN0marke","name":"Сорский ГОК","type":"gok","latitude":54,"longitude":90.25,"region":"Хакасия","country":"РФ","is_ours":false,"description":"Медный и молибденовый концентрат","holding":""},
  {"id":"CNbSgNVwhU3bTpMdQpW0marke","name":"Норильский комбинат","type":"gok","latitude":69.33,"longitude":88.22,"region":"Красноярский край","country":"РФ","is_ours":false,"description":"Медно-никелевые руды","holding":"Норникель"},
  {"id":"frKvD2RvGPFI5k3cSV20marke","name":"Айхальский ГОК","type":"gok","latitude":65.94,"longitude":111.53,"region":"Республика Саха (Якутия)","country":"РФ","is_ours":false,"description":"Алмазы","holding":"АЛРОСА"},
  {"id":"ZXAO6DbiUx9zn43wSeb0marke","name":"Удачнинский ГОК","type":"gok","latitude":66.4,"longitude":112.4,"region":"Республика Саха (Якутия)","country":"РФ","is_ours":false,"description":"Алмазы","holding":"АЛРОСА"},
  {"id":"0vvMJwhFoWNC3cUw0jI0marke","name":"Мирнинско-Нюрбинский ГОК","type":"gok","latitude":62.53,"longitude":113.96,"region":"Республика Саха (Якутия)","country":"РФ","is_ours":false,"description":"Алмазы","holding":"АЛРОСА"},
  {"id":"OZpqxKGbDt1jRLecCyx0marke","name":"АЛРОСА","type":"gok","latitude":62.53,"longitude":113.96,"region":"Республика Саха (Якутия)","country":"РФ","is_ours":false,"description":"Алмазы, производство бриллиантов","holding":"АЛРОСА"},
  {"id":"59pCwWvvfBWzSCU9UBW0marke","name":"Отвал КУЗ (Каменск-Уральский)","type":"slag_dump","latitude":56.4,"longitude":61.93,"region":"Свердловская область","country":"РФ","is_ours":false,"description":"Алюминиевые шлаки (красные шламы)","holding":"КУЗ"},
  {"id":"LOIueoD6FFROgMX3OGy0marke","name":"Фосфогипсовый отвал Воскресенск","type":"slag_dump","latitude":55.32,"longitude":38.68,"region":"Московская область","country":"РФ","is_ours":false,"description":"Фосфогипс","holding":"Воскресенские минудобрения"},
  {"id":"Xp7Hjzg7mScLpMbR7NI0marke","name":"Челябинский трубопрокатный завод","type":"steel_mill","latitude":55.16,"longitude":61.4,"region":"Челябинская область","country":"РФ","is_ours":false,"description":"Трубы электросварные и бесшовные","holding":""},
  {"id":"LhzFrrfAWfMCO8YB8kT0marke","name":"Челябинский МК (ЧМК)","type":"steel_mill","latitude":55.18,"longitude":61.38,"region":"Челябинская область","country":"РФ","is_ours":false,"description":"Металлургическая продукция","holding":""},
  {"id":"opATDWksDEI8XaoN88P0marke","name":"ЕВРАЗ НТМК (Нижний Тагил)","type":"steel_mill","latitude":57.92,"longitude":59.97,"region":"Свердловская область","country":"РФ","is_ours":false,"description":"Ж/д колёса, рельсы, балки","holding":"ЕВРАЗ"},
  {"id":"gZX1nOi0KrJvfvZXiUK0marke","name":"ЕВРАЗ ЗСМК (Новокузнецк)","type":"steel_mill","latitude":53.75,"longitude":87.12,"region":"Кемеровская область","country":"РФ","is_ours":false,"description":"Арматура, проволока, лист","holding":"ЕВРАЗ"},
  {"id":"CZBy60iqMLOawzppoTs0marke","name":"ОЭМК (Старый Оскол)","type":"steel_mill","latitude":51.3,"longitude":37.83,"region":"Белгородская область","country":"РФ","is_ours":false,"description":"ПВЖ, прокат, стальные шары","holding":"Металлинвест"},
  {"id":"KBVncfjLW8xpsGfJ7HE0marke","name":"ВМК Красный Октябрь (Волгоград)","type":"steel_mill","latitude":48.7,"longitude":44.52,"region":"Волгоградская область","country":"РФ","is_ours":false,"description":"Трубная заготовка, прокат","holding":""},
  {"id":"nFtLhm86VSohneqoPuP0marke","name":"Тырныаузский ГОК","type":"gok","latitude":43.4,"longitude":42.9,"region":"Кабардино-Балкария","country":"РФ","is_ours":false,"description":"Вольфрам","holding":""},
  {"id":"mzWMkekAvTsO3qcmMwf0marke","name":"НЛМК-Урал (Ревда)","type":"steel_mill","latitude":56.8,"longitude":59.93,"region":"Свердловская область","country":"РФ","is_ours":false,"description":"Непрерывнолитая заготовка, арматура","holding":"НЛМК"},
  {"id":"kzjZHn271kx8nsNASWz0marke","name":"Амурсталь (Комсомольск-на-Амуре)","type":"steel_mill","latitude":50.55,"longitude":137.02,"region":"Хабаровский край","country":"РФ","is_ours":false,"description":"Сортовой стальной прокат","holding":""},
  {"id":"CL1Bx3hFUPiAYgasSV00marke","name":"Шахта Абайская","type":"coal_mine","latitude":49.78,"longitude":73.1,"region":"Карагандинская область","country":"Казахстан","is_ours":false,"description":"Коксующийся уголь","holding":""},
  {"id":"W2YQ2BTIOEeYeh6T9on0marke","name":"Шахта Ангренская","type":"coal_mine","latitude":40.92,"longitude":69.98,"region":"Ташкентская область","country":"Узбекистан","is_ours":false,"description":"Бурый уголь (лигнит)","holding":""},
  {"id":"MioQrLLLMc7fgv9s0f10marke","name":"Отвал НЛМК (Липецк)","type":"slag_dump","latitude":52.6,"longitude":39.6,"region":"Липецкая область","country":"РФ","is_ours":true,"description":"Доменные шлаки","holding":"НЛМК"},
  {"id":"iDheetByMuJXXTsHTq10marke","name":"Отвал Северсталь (Череповец)","type":"slag_dump","latitude":59.12,"longitude":37.9,"region":"Вологодская область","country":"РФ","is_ours":false,"description":"Доменные шлаки","holding":"Северсталь"},
  {"id":"rcs07RLQVjarqw74xar0marke","name":"Отвал НТМК (Нижний Тагил)","type":"slag_dump","latitude":57.92,"longitude":59.97,"region":"Свердловская область","country":"РФ","is_ours":false,"description":"Доменные шлаки","holding":"ЕВРАЗ НТМК"},
  {"id":"BsyygIt83Np3CDAko6X0marke","name":"Отвал Новокузнецк","type":"slag_dump","latitude":53.75,"longitude":87.12,"region":"Кемеровская область","country":"РФ","is_ours":false,"description":"Доменные шлаки","holding":"ЕВРАЗ ЗСМК"},
  {"id":"HDdPS5qJFw4N2AH8IfJ0marke","name":"Коршуновский ГОК","type":"gok","latitude":56.58,"longitude":104.12,"region":"Иркутская область","country":"РФ","is_ours":false,"description":"Железная руда","holding":""},
  {"id":"FAFvT36fvX1Qq4FMmpM0marke","name":"Кыргызская сталь (Бишкек)","type":"steel_mill","latitude":42.87,"longitude":74.6,"region":"Бишкек","country":"Кыргызстан","is_ours":false,"description":"Строительная арматура","holding":""},
  {"id":"Xso1TnjGEcLjtOQTn2c0marke","name":"Пенза (Комлит)","type":"steel_mill","latitude":53.18,"longitude":45,"region":"Пензенская область","country":"РФ","is_ours":false,"description":"Литейное производство","holding":""},
  {"id":"tLL7m2PzJ0UL165o1d00marke","name":"Порт Дудинка","type":"port","latitude":69.4,"longitude":86.17,"region":"Красноярский край","country":"РФ","is_ours":false,"description":"Морской порт","holding":""},
  {"id":"yHS0Fu7jQq1S0eCHn4w0marke","name":"Выксунский металлургический завод (ВМЗ)","type":"steel_mill","latitude":55.32,"longitude":42.17,"region":"Нижегородская область","country":"РФ","is_ours":false,"description":"Трубы большого диаметра, колёса","holding":""},
  {"id":"z39M1Kg0Lz6WDtJmtuU0marke","name":"Ковдорский ГОК","type":"gok","latitude":67.56,"longitude":30.47,"region":"Мурманская область","country":"РФ","is_ours":false,"description":"Железная руда, апатит","holding":""},
  {"id":"7GYAT92siVclIULOjzP0marke","name":"Качканарский ГОК","type":"gok","latitude":58.7,"longitude":59.48,"region":"Свердловская область","country":"РФ","is_ours":false,"description":"Железная руда","holding":"Евраз"},
  {"id":"SmndAjuwo00NZqg5jvG0marke","name":"Сусуманзолото","type":"gok","latitude":62.78,"longitude":148.17,"region":"Магаданская область","country":"РФ","is_ours":false,"description":"Золото","holding":""},
  {"id":"I2g10C6WGTcsS9yYgUM0marke","name":"Михайловский ГОК","type":"gok","latitude":52.33,"longitude":35.35,"region":"Курская область","country":"РФ","is_ours":false,"description":"Железная руда","holding":"Металлинвест"},
  {"id":"WYO56kGeE6AtKHssvyc0marke","name":"Лебединский ГОК","type":"gok","latitude":51.28,"longitude":37.54,"region":"Белгородская область","country":"РФ","is_ours":false,"description":"Железная руда","holding":"Металлинвест"},
  {"id":"cDmGcOISLYzMATDXuMO0marke","name":"Костомукшский ГОК","type":"gok","latitude":64.58,"longitude":30.6,"region":"Карелия","country":"РФ","is_ours":false,"description":"Железная руда","holding":"Северсталь"},
  {"id":"WilEsMXVezZdGYnmmkl0marke","name":"Высокогорский ГОК","type":"gok","latitude":57.92,"longitude":59.97,"region":"Свердловская область","country":"РФ","is_ours":false,"description":"Железная руда, концентрат","holding":"НПРО «Урал»"},
  {"id":"tg6wk5Jpikfzlzc7E2l0marke","name":"Оленегорский ГОК","type":"gok","latitude":68.14,"longitude":33.28,"region":"Мурманская область","country":"РФ","is_ours":false,"description":"Железная руда","holding":""},
  {"id":"ACcLvaBZBWMtXbHxNYR0marke","name":"Порт Кавказ","type":"port","latitude":45.33,"longitude":36.68,"region":"Краснодарский край","country":"РФ","is_ours":false,"description":"Морской порт (паромный)","holding":""},
  {"id":"j923Xrn1yjaLuxd2jXz0marke","name":"Сочинский порт","type":"port","latitude":43.58,"longitude":39.72,"region":"Краснодарский край","country":"РФ","is_ours":false,"description":"Морской порт","holding":""},
  {"id":"4QVSYpMyzicocfeKFVx0marke","name":"Порт Диксон","type":"port","latitude":73.5,"longitude":80.53,"region":"Красноярский край","country":"РФ","is_ours":false,"description":"Морской порт","holding":""},
  {"id":"rV8IIkvgrcQVIjySUbI0marke","name":"Порт Нарьян-Мар","type":"port","latitude":67.63,"longitude":52.97,"region":"Ненецкий АО","country":"РФ","is_ours":false,"description":"Морской порт","holding":""},
  {"id":"EpelPVMYNZ4euFxN6Xz0marke","name":"Находкинский порт","type":"port","latitude":42.8,"longitude":132.88,"region":"Приморский край","country":"РФ","is_ours":false,"description":"Морской порт","holding":""},
  {"id":"eDleamqpV7SzewjOThC0marke","name":"Петропавловск-Камчатский порт","type":"port","latitude":53,"longitude":158.65,"region":"Камчатский край","country":"РФ","is_ours":false,"description":"Морской порт","holding":""},
  {"id":"nMvK6BlfXwMM4hyrm1X0marke","name":"Самарский порт","type":"port","latitude":53.2,"longitude":50.1,"region":"Самарская область","country":"РФ","is_ours":false,"description":"Речной порт","holding":""},
  {"id":"ocA7lcI6MQ5Y99ovXte0marke","name":"Волгоградский порт","type":"port","latitude":48.7,"longitude":44.52,"region":"Волгоградская область","country":"РФ","is_ours":false,"description":"Речной порт","holding":""},
  {"id":"fuHcbmDd7Q6ztQcIwXL0marke","name":"Красноярский порт","type":"port","latitude":56.01,"longitude":92.85,"region":"Красноярский край","country":"РФ","is_ours":false,"description":"Речной порт","holding":""},
  {"id":"faOaRFlCcIICp6vjT5O0marke","name":"Актауский порт","type":"port","latitude":43.65,"longitude":51.17,"region":"Мангистауская область","country":"Казахстан","is_ours":false,"description":"Международный морской порт","holding":""},
  {"id":"f69aXEfRPA3yPMIAi1a0marke","name":"Порт Джурджулешты","type":"port","latitude":45.47,"longitude":28.18,"region":"Кагульский район","country":"Молдова","is_ours":false,"description":"Международный свободный порт","holding":""},
  {"id":"kwvmra8VP2Nxme9VlfB0marke","name":"Измаильский порт","type":"port","latitude":45.35,"longitude":28.8,"region":"Одесская область","country":"Украина","is_ours":false,"description":"Морской торговый порт","holding":""},
  {"id":"ojzaUxtZEsiUqnyLLaa0marke","name":"Одесский порт","type":"port","latitude":46.48,"longitude":30.73,"region":"Одесская область","country":"Украина","is_ours":false,"description":"Морской торговый порт","holding":""},
  {"id":"WRQxrSVSHLgnILGvoK30marke","name":"Шахта Распадская","type":"coal_mine","latitude":53.72,"longitude":88.02,"region":"Кемеровская область","country":"РФ","is_ours":false,"description":"Каменный уголь","holding":"Распадская"},
  {"id":"wTeFGwl8lYsT9iF4HvG0marke","name":"Шахта им. В.Д. Ялевского","type":"coal_mine","latitude":53.95,"longitude":86.75,"region":"Кемеровская область","country":"РФ","is_ours":false,"description":"Каменный уголь","holding":"СУЭК-Кузбасс"},
  {"id":"J4veEp28GQBiPgzZkpE0marke","name":"Шахта им. А.Д. Рубана","type":"coal_mine","latitude":53.85,"longitude":86.6,"region":"Кемеровская область","country":"РФ","is_ours":false,"description":"Каменный уголь","holding":"СУЭК-Кузбасс"},
  {"id":"wQaGRhoGjGhTQyPZUfb0marke","name":"Шахта им. С.Д. Тихова","type":"coal_mine","latitude":53.7,"longitude":87.3,"region":"Кемеровская область","country":"РФ","is_ours":false,"description":"Коксующийся уголь","holding":"ММК-УГОЛЬ"},
  {"id":"bsK63ZkdL3RKNNWHdDz0marke","name":"Шахта Ерунаковская-VIII","type":"coal_mine","latitude":53.6,"longitude":87.5,"region":"Кемеровская область","country":"РФ","is_ours":false,"description":"Каменный уголь","holding":"Южкузбассуголь"},
  {"id":"YbAmqBn1E6OFkuJsWZh0marke","name":"Шахта Костромовская","type":"coal_mine","latitude":53.75,"longitude":87.2,"region":"Кемеровская область","country":"РФ","is_ours":false,"description":"Каменный уголь","holding":"ММК-УГОЛЬ"},
  {"id":"jfKrOjRepaFeXBtEgg00marke","name":"Шахта Таштагольская","type":"coal_mine","latitude":52.75,"longitude":87.85,"region":"Кемеровская область","country":"РФ","is_ours":false,"description":"Каменный уголь","holding":""},
  {"id":"9MIoTUxUbUcsJUmvQmb0marke","name":"Шахта Воргашорская","type":"coal_mine","latitude":67.58,"longitude":63.8,"region":"Республика Коми","country":"РФ","is_ours":false,"description":"Каменный уголь","holding":"ВоркутаУголь"},
  {"id":"mv4JZa5eIwZ9HVxMvE40marke","name":"Шахта Заполярная","type":"coal_mine","latitude":67.62,"longitude":64.1,"region":"Республика Коми","country":"РФ","is_ours":false,"description":"Каменный уголь","holding":"ВоркутаУголь"},
  {"id":"gcsNlTCOxNLZD58wbay0marke","name":"Шахта Комсомольская","type":"coal_mine","latitude":67.55,"longitude":63.75,"region":"Республика Коми","country":"РФ","is_ours":false,"description":"Каменный уголь","holding":"ВоркутаУголь"},
  {"id":"TMbQKekSXT9sScqk0Zd0marke","name":"Шахта Антоновская","type":"coal_mine","latitude":53.65,"longitude":87.1,"region":"Кемеровская область","country":"РФ","is_ours":false,"description":"Каменный уголь","holding":""},
  {"id":"bLId6IgygZD6hmnDCZs0marke","name":"Шахта Листвяжная","type":"coal_mine","latitude":54.2,"longitude":86.55,"region":"Кемеровская область","country":"РФ","is_ours":false,"description":"Каменный уголь","holding":""},
  {"id":"cYYKb0ZpnY1uSNVWg640marke","name":"Шахта №12","type":"coal_mine","latitude":53.95,"longitude":86.65,"region":"Кемеровская область","country":"РФ","is_ours":false,"description":"Каменный уголь","holding":""},
  {"id":"I3bZ0JAVu7FZUzDNvkq0marke","name":"Шахта Инаглинская","type":"coal_mine","latitude":56.3,"longitude":124.8,"region":"Республика Саха (Якутия)","country":"РФ","is_ours":false,"description":"Каменный уголь","holding":""},
  {"id":"VZ9T44jDFUcPmV75aLT0marke","name":"Шахта Денисовская","type":"coal_mine","latitude":56.35,"longitude":124.9,"region":"Республика Саха (Якутия)","country":"РФ","is_ours":false,"description":"Каменный уголь","holding":""},
  {"id":"L0UzYKYTxrv4m161O6N0marke","name":"Молдавский МЗ (Рыбница)","type":"steel_mill","latitude":47.77,"longitude":29,"region":"Рыбница","country":"Молдова","is_ours":false,"description":"Сортовой прокат, катанка","holding":""},
  {"id":"vTFDEQnkOEZCQoY2Sv30marke","name":"МТЗ (Минский тракторный завод)","type":"steel_mill","latitude":53.9,"longitude":27.56,"region":"Минск","country":"Беларусь","is_ours":false,"description":"Тракторы, техника","holding":""},
  {"id":"SfVveCMySUK7J04H2cJ0marke","name":"Армянская металлургическая компания","type":"steel_mill","latitude":40.18,"longitude":44.52,"region":"Ереван","country":"Армения","is_ours":false,"description":"Арматура, уголок, швеллер","holding":""},
  {"id":"fSMwhzKLBMQb1uAJCDu0marke","name":"Фролово (скрап)","type":"steel_mill","latitude":49.75,"longitude":43.55,"region":"Волгоградская область","country":"РФ","is_ours":false,"description":"Приём скрапа","holding":""},
  {"id":"5cDgv24B4LUBIPURdKq0marke","name":"Смоленск (ЯМЗ)","type":"steel_mill","latitude":54.78,"longitude":32.05,"region":"Смоленская область","country":"РФ","is_ours":false,"description":"Приём металлолома","holding":""}
];

export const rawFactories: Factory[] = applyOurSitesToFactories(_baseFactories);

export const rawShipmentsData = [
  {"id":"Gxq1xLRFcjU9nvdjXoN0marke","originId":"RefLink(:t_barskarta_factories_iaz:25444, KBVncfjLW8xpsGfJ7HE0marke)","destinationId":"RefLink(:t_barskarta_factories_iaz:25444, vv1VwQmm4PwAyvuHxIQ0marke)","cargoType":"Скрап 100+ чистый","volume":46.424,"unit":"т","source":"own","period":"2025"},
  {"id":"dM4F9pruF4DwZcySVbN0marke","originId":"RefLink(:t_barskarta_factories_iaz:25444, aQOWlcH4hpZYSUfRL1M0marke)","destinationId":"RefLink(:t_barskarta_factories_iaz:25444, YFgsGkFdtBeLTGQPy7U0marke)","cargoType":"Скрап 100+ шайбленка","volume":144.554,"unit":"т","source":"own","period":"2025"},
  {"id":"ousBsbH2U786bqYfwQJ0marke","originId":"RefLink(:t_barskarta_factories_iaz:25444, 7dur8DgcU9QQdM3ZKyb0marke)","destinationId":"RefLink(:t_barskarta_factories_iaz:25444, YFgsGkFdtBeLTGQPy7U0marke)","cargoType":"Доменный шлак ЧМЗ (кат 2-4)","volume":1050.2,"unit":"т","source":"own","period":"2025"},
  {"id":"ddDvtvOVANV48i0n80V0marke","originId":"RefLink(:t_barskarta_factories_iaz:25444, aQOWlcH4hpZYSUfRL1M0marke)","destinationId":"RefLink(:t_barskarta_factories_iaz:25444, 901yVhUYyirMQCYhcwY0marke)","cargoType":"Скрап 0-10","volume":188.64,"unit":"т","source":"own","period":"2025"},
  {"id":"S1IgKdrkNbiCjDeTucA0marke","originId":"RefLink(:t_barskarta_factories_iaz:25444, aQOWlcH4hpZYSUfRL1M0marke)","destinationId":"RefLink(:t_barskarta_factories_iaz:25444, Xso1TnjGEcLjtOQTn2c0marke)","cargoType":"Скрап 100+ (кат. Б1)","volume":86.43,"unit":"т","source":"own","period":"2025"},
  {"id":"S6TLZLq1EdO8TqZl3Lz0marke","originId":"RefLink(:t_barskarta_factories_iaz:25444, aQOWlcH4hpZYSUfRL1M0marke)","destinationId":"RefLink(:t_barskarta_factories_iaz:25444, Xso1TnjGEcLjtOQTn2c0marke)","cargoType":"Скрап 70+ (кат. Линзы) КОЛОТЫЕ","volume":92.79,"unit":"т","source":"own","period":"2025"},
  {"id":"eOzAVxBlgeMoxEX1vTK0marke","originId":"RefLink(:t_barskarta_factories_iaz:25444, 7dur8DgcU9QQdM3ZKyb0marke)","destinationId":"RefLink(:t_barskarta_factories_iaz:25444, od2Ya9705rE7DcOxr6Z0marke)","cargoType":"Скрап 10-40","volume":123.57,"unit":"т","source":"own","period":"2025"},
  {"id":"xvqLNRm8PIh0b6oBhSW0marke","originId":"RefLink(:t_barskarta_factories_iaz:25444, aQOWlcH4hpZYSUfRL1M0marke)","destinationId":"RefLink(:t_barskarta_factories_iaz:25444, vsJbuuTqw4YXnWIe93u0marke)","cargoType":"Скрап 100+ магн.","volume":93.54,"unit":"т","source":"own","period":"2025"},
  {"id":"htE9MMCReOugBlr2JRo0marke","originId":"RefLink(:t_barskarta_factories_iaz:25444, 7dur8DgcU9QQdM3ZKyb0marke)","destinationId":"RefLink(:t_barskarta_factories_iaz:25444, vsJbuuTqw4YXnWIe93u0marke)","cargoType":"Скрап 100+ чистый","volume":56.16,"unit":"т","source":"own","period":"2025"},
  {"id":"l82d2SumG9Rsa8wBn2j0marke","originId":"RefLink(:t_barskarta_factories_iaz:25444, 7dur8DgcU9QQdM3ZKyb0marke)","destinationId":"RefLink(:t_barskarta_factories_iaz:25444, CqwMU6BCaUnXJRBvkmW0marke)","cargoType":"Скрап 40-100 магн. 1 сепарации","volume":9138.04,"unit":"т","source":"own","period":"2025"},
  {"id":"WbGGgNjU9slP4DYOCP30marke","originId":"RefLink(:t_barskarta_factories_iaz:25444, 7dur8DgcU9QQdM3ZKyb0marke)","destinationId":"RefLink(:t_barskarta_factories_iaz:25444, vsJbuuTqw4YXnWIe93u0marke)","cargoType":"Скрап 100+ шайбленка","volume":538.29,"unit":"т","source":"own","period":"2025"},
  {"id":"8YnChhFFQfkWFQCzk780marke","originId":"RefLink(:t_barskarta_factories_iaz:25444, aQOWlcH4hpZYSUfRL1M0marke)","destinationId":"RefLink(:t_barskarta_factories_iaz:25444, nQ44CySvaLCuHlE35PT0marke)","cargoType":"Скрап 10-100 отгалтованный","volume":1,"unit":"т","source":"own","period":"2025"},
  {"id":"MRDEnVPZNwI3LRG1jvw0marke","originId":"RefLink(:t_barskarta_factories_iaz:25444, 7dur8DgcU9QQdM3ZKyb0marke)","destinationId":"RefLink(:t_barskarta_factories_iaz:25444, jH3IXI7ALXEkuUJNXYw0marke)","cargoType":"Скрап 1000+","volume":51.87,"unit":"т","source":"own","period":"2025"},
  {"id":"HVyMcmUk1r8jQ1TizDE0marke","originId":"RefLink(:t_barskarta_factories_iaz:25444, 7GYAT92siVclIULOjzP0marke)","destinationId":"RefLink(:t_barskarta_factories_iaz:25444, opATDWksDEI8XaoN88P0marke)","cargoType":"Железорудный концентрат","volume":150000,"unit":"т","source":"rzd","period":"2025"},
  {"id":"Tz75ZUfJUBxyH9FAzVt0marke","originId":"RefLink(:t_barskarta_factories_iaz:25444, wTeFGwl8lYsT9iF4HvG0marke)","destinationId":"RefLink(:t_barskarta_factories_iaz:25444, gZX1nOi0KrJvfvZXiUK0marke)","cargoType":"Каменный уголь","volume":250000,"unit":"т","source":"rzd","period":"2025"},
  {"id":"0bNPt92ibRjyKk3oax40marke","originId":"RefLink(:t_barskarta_factories_iaz:25444, 7dur8DgcU9QQdM3ZKyb0marke)","destinationId":"RefLink(:t_barskarta_factories_iaz:25444, ixqnCXWImEoTNQyX3Wp0marke)","cargoType":"Доменный шлак","volume":35000,"unit":"т","source":"own","period":"2025"},
  {"id":"KnDUb987F0bHlPsZuKM0marke","originId":"RefLink(:t_barskarta_factories_iaz:25444, 9MIoTUxUbUcsJUmvQmb0marke)","destinationId":"RefLink(:t_barskarta_factories_iaz:25444, KGB8y4jrPdHdg1eGD7j0marke)","cargoType":"Коксующийся уголь","volume":180000,"unit":"т","source":"rzd","period":"2025"},
  {"id":"83yonnqCvrrPc3OeaSQ0marke","originId":"RefLink(:t_barskarta_factories_iaz:25444, MioQrLLLMc7fgv9s0f10marke)","destinationId":"RefLink(:t_barskarta_factories_iaz:25444, YFgsGkFdtBeLTGQPy7U0marke)","cargoType":"Шлак доменный (переработка)","volume":56000,"unit":"т","source":"own","period":"2025"},
  {"id":"KpCEqX5rzqGn8L6IaFH0marke","originId":"RefLink(:t_barskarta_factories_iaz:25444, aQOWlcH4hpZYSUfRL1M0marke)","destinationId":"RefLink(:t_barskarta_factories_iaz:25444, opATDWksDEI8XaoN88P0marke)","cargoType":"Слябы","volume":20000,"unit":"т","source":"own","period":"2025"},
  {"id":"1FUV8cwhL2o3JXw6WZI0marke","originId":"RefLink(:t_barskarta_factories_iaz:25444, 7dur8DgcU9QQdM3ZKyb0marke)","destinationId":"RefLink(:t_barskarta_factories_iaz:25444, fSMwhzKLBMQb1uAJCDu0marke)","cargoType":"Немагнитный марганцовистый скрап","volume":12.146,"unit":"т","source":"own","period":"2025"},
  {"id":"sKXlyHsPNexZyWM8iSs0marke","originId":"RefLink(:t_barskarta_factories_iaz:25444, 7dur8DgcU9QQdM3ZKyb0marke)","destinationId":"RefLink(:t_barskarta_factories_iaz:25444, fSMwhzKLBMQb1uAJCDu0marke)","cargoType":"Скрап 100+ для сортировки","volume":1362.15,"unit":"т","source":"own","period":"2025"},
  {"id":"fmC4CftaDfgaEbogf770marke","originId":"RefLink(:t_barskarta_factories_iaz:25444, 7dur8DgcU9QQdM3ZKyb0marke)","destinationId":"RefLink(:t_barskarta_factories_iaz:25444, fSMwhzKLBMQb1uAJCDu0marke)","cargoType":"Скрап 150-300 (кат. Б1)","volume":22.85,"unit":"т","source":"own","period":"2025"},
  {"id":"AAs0s25RC0ZpfSvB71T0marke","originId":"RefLink(:t_barskarta_factories_iaz:25444, 7dur8DgcU9QQdM3ZKyb0marke)","destinationId":"RefLink(:t_barskarta_factories_iaz:25444, fSMwhzKLBMQb1uAJCDu0marke)","cargoType":"Скрап 150-300 (кат. Б2)","volume":4.34,"unit":"т","source":"own","period":"2025"},
  {"id":"9uuq0rP8W2fWmYaT7vA0marke","originId":"RefLink(:t_barskarta_factories_iaz:25444, 7dur8DgcU9QQdM3ZKyb0marke)","destinationId":"RefLink(:t_barskarta_factories_iaz:25444, fSMwhzKLBMQb1uAJCDu0marke)","cargoType":"Скрап 300+ (кат. Б1)","volume":9.96,"unit":"т","source":"own","period":"2025"},
  {"id":"Z53NFsAewxKx0PgWGKi0marke","originId":"RefLink(:t_barskarta_factories_iaz:25444, aQOWlcH4hpZYSUfRL1M0marke)","destinationId":"RefLink(:t_barskarta_factories_iaz:25444, fSMwhzKLBMQb1uAJCDu0marke)","cargoType":"Скрап 70+ (кат. А)","volume":285.4,"unit":"т","source":"own","period":"2025"},
  {"id":"FRIhZLlRukn9460uyIY0marke","originId":"RefLink(:t_barskarta_factories_iaz:25444, 7dur8DgcU9QQdM3ZKyb0marke)","destinationId":"RefLink(:t_barskarta_factories_iaz:25444, fSMwhzKLBMQb1uAJCDu0marke)","cargoType":"Скрап 70+ (кат. А) резанный","volume":0.54,"unit":"т","source":"own","period":"2025"},
  {"id":"Ayfuyk6tr3FmUxpZNn00marke","originId":"RefLink(:t_barskarta_factories_iaz:25444, aQOWlcH4hpZYSUfRL1M0marke)","destinationId":"RefLink(:t_barskarta_factories_iaz:25444, 5cDgv24B4LUBIPURdKq0marke)","cargoType":"Скрап 10-100","volume":1176.12,"unit":"т","source":"own","period":"2025"},
  {"id":"bEgOIPJ85xBF2TzsaxP0marke","originId":"RefLink(:t_barskarta_factories_iaz:25444, aQOWlcH4hpZYSUfRL1M0marke)","destinationId":"RefLink(:t_barskarta_factories_iaz:25444, fgsHegI3G1c9W0kaadY0marke)","cargoType":"Скрап 100+ (кат. Б1)","volume":621.82,"unit":"т","source":"own","period":"2025"},
  {"id":"Jx33GzBRBjCpzCLvPtC0marke","originId":"RefLink(:t_barskarta_factories_iaz:25444, aQOWlcH4hpZYSUfRL1M0marke)","destinationId":"RefLink(:t_barskarta_factories_iaz:25444, fgsHegI3G1c9W0kaadY0marke)","cargoType":"Скрап 70+ (кат. Линзы) КОЛОТЫЕ","volume":138.5,"unit":"т","source":"own","period":"2025"},
  {"id":"GUa4sP5k6AV6LfHmvso0marke","originId":"RefLink(:t_barskarta_factories_iaz:25444, cDmGcOISLYzMATDXuMO0marke)","destinationId":"RefLink(:t_barskarta_factories_iaz:25444, KGB8y4jrPdHdg1eGD7j0marke)","cargoType":"Железорудные окатыши","volume":180000,"unit":"т","source":"rzd","period":"2025"},
  {"id":"XYA2pGVgynExdKudX0o0marke","originId":"RefLink(:t_barskarta_factories_iaz:25444, z39M1Kg0Lz6WDtJmtuU0marke)","destinationId":"RefLink(:t_barskarta_factories_iaz:25444, KGB8y4jrPdHdg1eGD7j0marke)","cargoType":"Железорудный концентрат","volume":90000,"unit":"т","source":"rzd","period":"2025"},
  {"id":"kauUZW8BXswxJCfUe130marke","originId":"RefLink(:t_barskarta_factories_iaz:25444, aQOWlcH4hpZYSUfRL1M0marke)","destinationId":"RefLink(:t_barskarta_factories_iaz:25444, oibHonkvM6vucbytNDm0marke)","cargoType":"Стальной лист","volume":45000,"unit":"т","source":"own","period":"2025"},
  {"id":"Up8QkVbhYIT5eYGdUeG0marke","originId":"RefLink(:t_barskarta_factories_iaz:25444, 7dur8DgcU9QQdM3ZKyb0marke)","destinationId":"RefLink(:t_barskarta_factories_iaz:25444, oibHonkvM6vucbytNDm0marke)","cargoType":"Легированная сталь","volume":28000,"unit":"т","source":"own","period":"2025"},
  {"id":"quqO4Zavk3CytnT8Ddy0marke","originId":"RefLink(:t_barskarta_factories_iaz:25444, aQOWlcH4hpZYSUfRL1M0marke)","destinationId":"RefLink(:t_barskarta_factories_iaz:25444, vTFDEQnkOEZCQoY2Sv30marke)","cargoType":"Трансформаторная сталь","volume":15000,"unit":"т","source":"own","period":"2025"},
  {"id":"0Mg4rFXMiwldGn9Kyi50marke","originId":"RefLink(:t_barskarta_factories_iaz:25444, 7dur8DgcU9QQdM3ZKyb0marke)","destinationId":"RefLink(:t_barskarta_factories_iaz:25444, od2Ya9705rE7DcOxr6Z0marke)","cargoType":"Скрап 10-40 слабомагн.","volume":41.81,"unit":"т","source":"own","period":"2025"},
  {"id":"cVxcL1foQhsVPmIC8QI0marke","originId":"RefLink(:t_barskarta_factories_iaz:25444, 7dur8DgcU9QQdM3ZKyb0marke)","destinationId":"RefLink(:t_barskarta_factories_iaz:25444, jH3IXI7ALXEkuUJNXYw0marke)","cargoType":"Скрап 100+ шайбленка","volume":1.12,"unit":"т","source":"own","period":"2025"},
  {"id":"4qsNA43iSwJaWtlHExq0marke","originId":"RefLink(:t_barskarta_factories_iaz:25444, 7dur8DgcU9QQdM3ZKyb0marke)","destinationId":"RefLink(:t_barskarta_factories_iaz:25444, jH3IXI7ALXEkuUJNXYw0marke)","cargoType":"Скрап 300+","volume":9.75,"unit":"т","source":"own","period":"2025"},
  {"id":"GhNhqO6KvM7qCOXCvEF0marke","originId":"RefLink(:t_barskarta_factories_iaz:25444, aQOWlcH4hpZYSUfRL1M0marke)","destinationId":"RefLink(:t_barskarta_factories_iaz:25444, nQ44CySvaLCuHlE35PT0marke)","cargoType":"Скрап 10-100","volume":1,"unit":"т","source":"own","period":"2025"},
  {"id":"rvmV5tj2ThVNx1QsvL40marke","originId":"RefLink(:t_barskarta_factories_iaz:25444, 7dur8DgcU9QQdM3ZKyb0marke)","destinationId":"RefLink(:t_barskarta_factories_iaz:25444, sKL6yYQuvUB7iS1L0xH0marke)","cargoType":"Штабель ММК 0-10 (шихта №1)","volume":5340.6,"unit":"т","source":"own","period":"2025"},
  {"id":"ConVa6JYiECb4dTf8NF0marke","originId":"RefLink(:t_barskarta_factories_iaz:25444, WYO56kGeE6AtKHssvyc0marke)","destinationId":"RefLink(:t_barskarta_factories_iaz:25444, aQOWlcH4hpZYSUfRL1M0marke)","cargoType":"Железорудный концентрат","volume":250000,"unit":"т","source":"rzd","period":"2025"},
  {"id":"NnsFIznkm2A6rxEKdbK0marke","originId":"RefLink(:t_barskarta_factories_iaz:25444, VJWB4m6QRNbWxHyFnsV0marke)","destinationId":"RefLink(:t_barskarta_factories_iaz:25444, aQOWlcH4hpZYSUfRL1M0marke)","cargoType":"Железная руда","volume":180000,"unit":"т","source":"rzd","period":"2025"},
  {"id":"fY0vUGAUDdsp50DmZje0marke","originId":"RefLink(:t_barskarta_factories_iaz:25444, I2g10C6WGTcsS9yYgUM0marke)","destinationId":"RefLink(:t_barskarta_factories_iaz:25444, KGB8y4jrPdHdg1eGD7j0marke)","cargoType":"Железная руда","volume":200000,"unit":"т","source":"rzd","period":"2025"},
  {"id":"bEXUZjbdV56mEZPYJ5b0marke","originId":"RefLink(:t_barskarta_factories_iaz:25444, aQOWlcH4hpZYSUfRL1M0marke)","destinationId":"RefLink(:t_barskarta_factories_iaz:25444, R6ZLZXGGTpHBgLSGzxt0marke)","cargoType":"Горячекатаный лист (экспорт)","volume":120000,"unit":"т","source":"own","period":"2025"},
  {"id":"kXhG2NYjVqwtJG5IrnQ0marke","originId":"RefLink(:t_barskarta_factories_iaz:25444, KGB8y4jrPdHdg1eGD7j0marke)","destinationId":"RefLink(:t_barskarta_factories_iaz:25444, SwNj2LQ1zHyfzyPFk7l0marke)","cargoType":"Листовой прокат (экспорт)","volume":90000,"unit":"т","source":"rzd","period":"2025"},
  {"id":"bJebmzld3MDPikxegeV0marke","originId":"RefLink(:t_barskarta_factories_iaz:25444, ixqnCXWImEoTNQyX3Wp0marke)","destinationId":"RefLink(:t_barskarta_factories_iaz:25444, R6ZLZXGGTpHBgLSGzxt0marke)","cargoType":"Сортовой прокат (экспорт)","volume":75000,"unit":"т","source":"rzd","period":"2025"},
  {"id":"FmexNz447JMj80BNwp80marke","originId":"RefLink(:t_barskarta_factories_iaz:25444, WRQxrSVSHLgnILGvoK30marke)","destinationId":"RefLink(:t_barskarta_factories_iaz:25444, gZX1nOi0KrJvfvZXiUK0marke)","cargoType":"Коксующийся уголь","volume":300000,"unit":"т","source":"rzd","period":"2025"},
  {"id":"quTvYa4bPd32f814ch60marke","originId":"RefLink(:t_barskarta_factories_iaz:25444, eZTcHFCijYb5PusNglV0marke)","destinationId":"RefLink(:t_barskarta_factories_iaz:25444, vTFDEQnkOEZCQoY2Sv30marke)","cargoType":"Сортовой прокат","volume":25000,"unit":"т","source":"rzd","period":"2025"},
  {"id":"TszIYtafPle8A1RFSKR0marke","originId":"RefLink(:t_barskarta_factories_iaz:25444, eCZyOt1ta9EDZ75OPiM0marke)","destinationId":"RefLink(:t_barskarta_factories_iaz:25444, aQOWlcH4hpZYSUfRL1M0marke)","cargoType":"Чугун","volume":12000,"unit":"т","source":"rzd","period":"2025"},
  {"id":"RBeBARMIo2xLo4kgWB40marke","originId":"RefLink(:t_barskarta_factories_iaz:25444, CZBy60iqMLOawzppoTs0marke)","destinationId":"RefLink(:t_barskarta_factories_iaz:25444, aQOWlcH4hpZYSUfRL1M0marke)","cargoType":"ПВЖ (прямовосстановленное железо)","volume":80000,"unit":"т","source":"rzd","period":"2025"},
  {"id":"EUTzxzE0N7jdbkons3b0marke","originId":"RefLink(:t_barskarta_factories_iaz:25444, CPETqoih6u4rMKIfS9Q0marke)","destinationId":"RefLink(:t_barskarta_factories_iaz:25444, Xp7Hjzg7mScLpMbR7NI0marke)","cargoType":"Стальная заготовка","volume":35000,"unit":"т","source":"rzd","period":"2025"},
  {"id":"1TfIP3bhzMUjfZPvrFk0marke","originId":"RefLink(:t_barskarta_factories_iaz:25444, JQaezvM9kxCsUa3j4N20marke)","destinationId":"RefLink(:t_barskarta_factories_iaz:25444, aQOWlcH4hpZYSUfRL1M0marke)","cargoType":"Товарный чугун","volume":15000,"unit":"т","source":"rzd","period":"2025"}
];

// Clean supply links with real factory IDs; optional synthetic telemetry for local demo only.
const statusDistribution: CargoStatus[] = ['en_route', 'en_route', 'en_route', 'delayed', 'arrived', 'loading'];
const carriersList = ['РЖД Логистика', 'Деловые Линии', 'FESCO Multimodal', 'Трансконтейнер', 'Первая Грузовая Компания'];

export type SupplyLinkSeedOptions = {
  /** Fake GPS, statuses, ETA, amounts — only for SEED_DEMO_DATA=true */
  syntheticTelemetry?: boolean;
};

export function getCleanSupplyLinks(options: SupplyLinkSeedOptions = {}): SupplyLink[] {
  const syntheticTelemetry = options.syntheticTelemetry ?? false;
  const factoryMap = new Map<string, Factory>();
  rawFactories.forEach(f => factoryMap.set(f.id, f));

  const resolved = rawShipmentsData.map((item) => ({
    item,
    originId: cleanRefId(item.originId),
    destinationId: cleanRefId(item.destinationId),
  }));

  const draftLinks: SupplyLink[] = resolved.map(({ item, originId, destinationId }) => ({
    id: item.id,
    origin_id: originId,
    destination_id: destinationId,
    cargo_type: item.cargoType,
    volume: item.volume,
    unit: item.unit || 'т',
    source: (item.source as 'own' | 'rzd') || 'own',
    period: item.period || '2025',
  }));

  const parallelIndex = buildRouteParallelIndex(draftLinks);

  return resolved.map(({ item, originId, destinationId }, idx) => {
    const origin = factoryMap.get(originId);
    const destination = factoryMap.get(destinationId);
    const productId = mapCargoTypeToProductId(item.cargoType);

    const base: SupplyLink = {
      id: item.id,
      origin_id: originId,
      destination_id: destinationId,
      cargo_type: item.cargoType,
      product_id: productId,
      flow_type: inferFlowType(origin, destination),
      volume: item.volume,
      unit: item.unit || 'т',
      source: (item.source as 'own' | 'rzd') || 'own',
      period: item.period || '2025',
      site_id: origin?.is_ours ? origin.id : destination?.is_ours ? destination.id : undefined,
    };

    if (!syntheticTelemetry) {
      return base;
    }

    const status = statusDistribution[idx % statusDistribution.length];
    const carrier = carriersList[idx % carriersList.length];
    const progress = status === 'arrived' ? 100 : status === 'loading' ? 0 : Math.floor(20 + (idx * 17) % 75);

    let curLat = origin ? origin.latitude : 55.0;
    let curLng = origin ? origin.longitude : 60.0;

    if (origin && destination) {
      const routePoints = buildRoutePoints(origin, destination, parallelIndex.get(item.id) ?? 0);
      const [lat, lng] = pointOnRoute(routePoints, progress);
      curLat = lat;
      curLng = lng;
    }

    const month = (idx % 12) + 1;
    const shipmentDate = `2025-${String(month).padStart(2, '0')}-${String((idx % 28) + 1).padStart(2, '0')}`;
    const etaAtDate = new Date(Date.now() + (idx * 3 + 1) * 3600000 * 4);

    return {
      ...base,
      shipment_date: shipmentDate,
      amount: Math.round(item.volume * (1200 + (idx % 5) * 300)),
      manager_name: `Менеджер ${['Соколов', 'Петров', 'Иванова', 'Козлов'][idx % 4]} Д.`,
      status,
      current_lat: curLat,
      current_lng: curLng,
      speed_kmh: status === 'en_route' ? Math.floor(55 + (idx * 7) % 35) : 0,
      progress_pct: progress,
      eta: etaAtDate.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit', day: 'numeric', month: 'short' }),
      eta_at: etaAtDate.toISOString(),
      carrier_name: carrier,
      driver_info: `Состав #${1000 + idx} (Машинист: Соколов И.В.)`,
      delay_reason: status === 'delayed' ? 'Ожидание маневрового локомотива / Снегопад' : undefined,
      last_updated: new Date().toISOString(),
    };
  });
}
