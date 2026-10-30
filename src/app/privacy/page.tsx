import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Политика обработки персональных данных — Архив города Н.',
};

// Реквизиты оператора заполняются владельцем сайта.
const OPERATOR = {
  name: '[ФИО индивидуального предпринимателя / самозанятого]',
  inn: '[ИНН]',
  email: '[email для обращений]',
  site: '[адрес сайта]',
};

export default function PrivacyPage() {
  return (
    <main className="mx-auto max-w-3xl px-4 py-10 sm:px-6 text-sm leading-relaxed text-muted-foreground space-y-5">
      <h1 className="font-display text-2xl uppercase tracking-[0.06em] text-foreground">
        Политика обработки персональных данных
      </h1>

      <section className="space-y-2">
        <h2 className="font-display text-base uppercase text-foreground">1. Общие положения</h2>
        <p>
          Настоящая политика составлена в соответствии с Федеральным законом от 27.07.2006 № 152-ФЗ «О персональных
          данных» и определяет порядок обработки персональных данных пользователей сайта {OPERATOR.site} (далее — Сайт).
        </p>
        <p>
          Оператор персональных данных: {OPERATOR.name}, ИНН {OPERATOR.inn}. Контакт для обращений: {OPERATOR.email}.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="font-display text-base uppercase text-foreground">2. Какие данные обрабатываются</h2>
        <ul className="list-disc pl-5 space-y-1">
          <li>адрес электронной почты;</li>
          <li>сведения о приобретённых делах и прогрессе прохождения игры;</li>
          <li>идентификаторы платежей (данные банковских карт Оператору не передаются и обрабатываются ЮKassa);</li>
          <li>технические данные: файлы cookie, необходимые для входа в аккаунт.</li>
        </ul>
      </section>

      <section className="space-y-2">
        <h2 className="font-display text-base uppercase text-foreground">3. Цели обработки</h2>
        <ul className="list-disc pl-5 space-y-1">
          <li>регистрация и вход на Сайт;</li>
          <li>предоставление доступа к приобретённым материалам и сохранение прогресса;</li>
          <li>исполнение договора и приём оплаты;</li>
          <li>ответы на обращения пользователей.</li>
        </ul>
      </section>

      <section className="space-y-2">
        <h2 className="font-display text-base uppercase text-foreground">4. Правовые основания и условия обработки</h2>
        <p>
          Обработка осуществляется на основании согласия пользователя, которое он даёт, отмечая соответствующий пункт при
          входе на Сайт, а также для исполнения договора, стороной которого является пользователь.
        </p>
        <p>
          Персональные данные граждан Российской Федерации записываются, систематизируются, накапливаются и хранятся в
          базах данных, находящихся на территории Российской Федерации. Трансграничная передача не осуществляется.
        </p>
        <p>
          Для отправки писем с кодом входа и приёма платежей Оператор может поручать обработку данных третьим лицам
          (сервис рассылок, ООО НКО «ЮМани» — сервис ЮKassa), обеспечивающим их конфиденциальность.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="font-display text-base uppercase text-foreground">5. Срок хранения и права пользователя</h2>
        <p>
          Данные хранятся до удаления аккаунта или отзыва согласия. Пользователь вправе запросить сведения об обработке
          своих данных, их уточнение или удаление, а также отозвать согласие, направив запрос на {OPERATOR.email}.
          Запрос рассматривается в срок, установленный законодательством.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="font-display text-base uppercase text-foreground">6. Защита данных</h2>
        <p>
          Оператор принимает правовые, организационные и технические меры для защиты персональных данных от
          неправомерного доступа, изменения, распространения и уничтожения.
        </p>
      </section>
    </main>
  );
}
