"use client";

import { useRef, useEffect } from 'react';
import Lenis from '@studio-freight/lenis';
import { useInView } from 'react-intersection-observer';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { Button } from "@/components/ui/button";

gsap.registerPlugin(ScrollTrigger);

export default function EventRegistration() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [ref, inView] = useInView({ threshold: 0.1 });

  // Инициализация плавного скролла
  useEffect(() => {
    const lenis = new Lenis({
      lerp: 0.1,
      smoothWheel: true,
      infinite: false,
    });

    lenis.on('scroll', ScrollTrigger.update);
    gsap.ticker.add((time) => lenis.raf(time * 1000));
    gsap.ticker.lagSmoothing(0);

    return () => lenis.destroy();
  }, []);

  // Анимации
  useEffect(() => {
    if (!containerRef.current) return;

    gsap.utils.toArray<HTMLElement>(".section").forEach((section) => {
      gsap.from(section, {
        opacity: 0,
        y: 50,
        duration: 1,
        scrollTrigger: { trigger: section, start: "top 80%" },
      });
    });

    gsap.utils.toArray<HTMLElement>(".text-reveal").forEach((element) => {
      gsap.from(element, {
        opacity: 0,
        y: 30,
        duration: 1,
        stagger: 0.2,
        scrollTrigger: { trigger: element, start: "top 90%" },
      });
    });

    // Параллакс эффект для карточек событий
    gsap.utils.toArray<HTMLElement>(".event-card").forEach((element) => {
      gsap.fromTo(
        element,
        { y: 50 },
        { y: -50, scrollTrigger: { trigger: element, scrub: 1 } }
      );
    });
  }, []);

  // Динамический фон
  useEffect(() => {
    if (!inView) return;

    const colors = [
      "from-blue-400 to-purple-500",
      "from-green-400 to-cyan-500",
      "from-orange-400 to-pink-500"
    ];

    let currentIndex = 0;
    const bgElement = document.getElementById("dynamic-bg");

    const changeColor = () => {
      if (!bgElement) return;
      currentIndex = (currentIndex + 1) % colors.length;
      bgElement.className = `absolute inset-0 bg-gradient-to-br ${colors[currentIndex]} opacity-10 transition-all duration-1000`;
    };

    changeColor();
    const interval = setInterval(changeColor, 5000);
    return () => clearInterval(interval);
  }, [inView]);

  // Моковые данные событий
  const events = [
    {
      id: 1,
      title: "Хакатон CodeBattle",
      date: "15-17 ноября 2023",
      description: "48-часовой марафон по созданию IT-решений для спортивных организаций",
      prize: "100 000 ₽",
      participants: 120,
      location: "Москва, Коворкинг 'Точка кипения'"
    },
    {
      id: 2,
      title: "Чемпионат по алгоритмам",
      date: "2 декабря 2023",
      description: "Соревнование по решению сложных алгоритмических задач на время",
      prize: "50 000 ₽",
      participants: 80,
      location: "Онлайн"
    },
    {
      id: 3,
      title: "AI Sports Challenge",
      date: "20-22 января 2024",
      description: "Создание ИИ-решений для анализа спортивных показателей",
      prize: "150 000 ₽",
      participants: 90,
      location: "Санкт-Петербург, IT-парк"
    }
  ];

  return (
    <div ref={containerRef} className="relative overflow-hidden">
      {/* Динамический фон */}
      <div id="dynamic-bg" className="absolute inset-0 bg-gradient-to-br from-blue-400 to-purple-500 opacity-10" />
      
      {/* Переключатель темы */}
      <div className="fixed top-4 right-4 z-50">
        <ThemeToggle />
      </div>

      {/* Главная секция */}
      <section ref={ref} className="relative min-h-screen flex flex-col items-center justify-center p-4 text-center section">
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="h-64 w-64 rounded-full bg-primary/10 blur-3xl" />
        </div>
        
        <div className="relative z-10 max-w-4xl mx-auto">
          <h1 className="text-5xl md:text-7xl font-bold mb-6 text-reveal">
            <span className="block">CodeSport</span>
            <span className="block text-primary">Events</span>
          </h1>
          
          <p className="text-xl md:text-2xl mb-8 text-reveal">
            Организация спортивных событий для разработчиков. Регистрируйтесь, соревнуйтесь, побеждайте!
          </p>
          
          <div className="flex gap-4 justify-center text-reveal">
            <Button size="lg" className="px-8">
              Зарегистрироваться
            </Button>
            <Button variant="outline" size="lg" className="px-8">
              Календарь событий
            </Button>
          </div>
        </div>

        <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 animate-bounce">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
          </svg>
        </div>
      </section>

      {/* О сервисе */}
      <section className="min-h-screen py-20 px-4 flex items-center justify-center bg-background/50 section">
        <div className="max-w-6xl mx-auto grid md:grid-cols-2 gap-12 items-center">
          <div className="text-reveal">
            <h2 className="text-4xl md:text-5xl font-bold mb-6">
              Цифровая платформа для <span className="text-primary">спортивного программирования</span>
            </h2>
            <p className="text-lg mb-6">
              Мы предоставляем полный цикл организации мероприятий: от регистрации участников до проведения соревнований и награждения победителей.
            </p>
            <ul className="space-y-3 text-lg">
              <li className="flex items-start">
                <svg className="h-6 w-6 text-primary mr-2 mt-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span>Автоматизированная регистрация и проверка участников</span>
              </li>
              <li className="flex items-start">
                <svg className="h-6 w-6 text-primary mr-2 mt-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span>Онлайн-трансляции и система мониторинга результатов</span>
              </li>
              <li className="flex items-start">
                <svg className="h-6 w-6 text-primary mr-2 mt-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span>Фирменная система рейтинга участников</span>
              </li>
            </ul>
          </div>
          
          <div className="relative h-96">
            <div className="absolute inset-0 bg-secondary rounded-2xl overflow-hidden flex items-center justify-center">
              <div className="relative z-10 p-8 text-center">
                <div className="text-6xl font-bold text-primary mb-4">127</div>
                <h3 className="text-2xl font-bold">Мероприятий проведено</h3>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Предстоящие события */}
      <section className="min-h-screen py-20 px-4 flex items-center justify-center section">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-4xl md:text-5xl font-bold mb-16 text-center text-reveal">
            Ближайшие <span className="text-primary">события</span>
          </h2>
          
          <div className="grid md:grid-cols-3 gap-8">
            {events.map((event) => (
              <div 
                key={event.id}
                className="bg-background p-6 rounded-2xl shadow-lg hover:shadow-xl transition-shadow duration-300 event-card text-reveal"
              >
                <div className="bg-primary/10 text-primary rounded-lg px-4 py-2 mb-4 inline-block">
                  {event.date}
                </div>
                <h3 className="text-2xl font-bold mb-3">{event.title}</h3>
                <p className="text-muted-foreground mb-4">{event.description}</p>
                
                <div className="space-y-3 mt-6">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Призовой фонд:</span>
                    <span className="font-bold">{event.prize}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Участников:</span>
                    <span className="font-bold">{event.participants}+</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Место:</span>
                    <span className="font-bold">{event.location}</span>
                  </div>
                </div>
                
                <Button className="w-full mt-6">
                  Участвовать
                </Button>
              </div>
            ))}
          </div>
          
          <div className="text-center mt-16">
            <Button variant="outline" size="lg">
              Все события
            </Button>
          </div>
        </div>
      </section>

      {/* Как это работает */}
      <section className="min-h-screen py-20 px-4 flex items-center justify-center bg-background/50 section">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl md:text-5xl font-bold mb-16 text-reveal">
            Как <span className="text-primary">участвовать</span>
          </h2>
          
          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                step: "1",
                title: "Регистрация",
                description: "Создайте профиль и заполните информацию о себе"
              },
              {
                step: "2",
                title: "Выбор события",
                description: "Выберите интересующее вас мероприятие"
              },
              {
                step: "3",
                title: "Подтверждение",
                description: "Оплатите участие (если требуется) и получите подтверждение"
              },
              {
                step: "4",
                title: "Подготовка",
                description: "Изучите регламент и подготовьтесь к соревнованиям"
              },
              {
                step: "5",
                title: "Участие",
                description: "Примите участие в мероприятии в указанные даты"
              },
              {
                step: "6",
                title: "Результаты",
                description: "Получите сертификат и посмотрите свои результаты"
              }
            ].map((item) => (
              <div key={item.step} className="bg-background p-6 rounded-xl text-reveal">
                <div className="text-4xl font-bold text-primary mb-4">{item.step}</div>
                <h3 className="text-xl font-bold mb-2">{item.title}</h3>
                <p className="text-muted-foreground">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Контакты */}
      <section className="min-h-screen py-20 px-4 flex items-center justify-center section">
        <div className="max-w-4xl mx-auto w-full text-center">
          <h2 className="text-4xl md:text-6xl font-bold mb-8 text-reveal">
            Готовы <span className="text-primary">участвовать</span>?
          </h2>
          
          <p className="text-xl mb-12 max-w-2xl mx-auto text-reveal">
            Оставьте заявку или свяжитесь с нами для организации собственного мероприятия
          </p>
          
          <form className="max-w-md mx-auto space-y-4 text-left text-reveal">
            <div>
              <label htmlFor="name" className="block mb-1 font-medium">Ваше имя</label>
              <input 
                type="text" 
                id="name" 
                className="w-full px-4 py-2 rounded-lg border border-muted-foreground/30 bg-background" 
                placeholder="Иван Иванов" 
              />
            </div>
            
            <div>
              <label htmlFor="email" className="block mb-1 font-medium">Email</label>
              <input 
                type="email" 
                id="email" 
                className="w-full px-4 py-2 rounded-lg border border-muted-foreground/30 bg-background" 
                placeholder="example@mail.ru" 
              />
            </div>
            
            <div>
              <label htmlFor="message" className="block mb-1 font-medium">Сообщение</label>
              <textarea 
                id="message" 
                rows={4}
                className="w-full px-4 py-2 rounded-lg border border-muted-foreground/30 bg-background" 
                placeholder="Расскажите о вашем мероприятии или задайте вопрос" 
              />
            </div>
            
            <Button type="submit" size="lg" className="w-full mt-6">
              Отправить заявку
            </Button>
          </form>
        </div>
      </section>

      {/* Подвал */}
      <footer className="py-12 px-4 text-center section">
        <div className="max-w-4xl mx-auto">
          <div className="text-2xl font-bold mb-6">CodeSport Events</div>
          <p className="text-muted-foreground mb-8">
            Организация спортивных событий для разработчиков с 2020 года
          </p>
          <div className="flex justify-center gap-6 mb-8">
            {['Telegram', 'VK', 'Habr', 'GitHub'].map((social) => (
              <a key={social} href="#" className="hover:text-primary transition-colors">
                {social}
              </a>
            ))}
          </div>
          <div className="text-sm text-muted-foreground">
            © {new Date().getFullYear()} CodeSport Events. Все права защищены.
          </div>
        </div>
      </footer>
    </div>
  );
}