/**
 * Seed de desarrollo — EduParche
 *
 * Crea datos de ejemplo para probar todos los roles y flujos.
 * Corre con: npm run db:seed
 * Resetea la BD y vuelve a sembrar: npm run db:reset && npm run db:seed
 *
 * Credenciales creadas:
 *   admin@eduparche.co   / Admin123!
 *   tutor@eduparche.co   / Tutor123!
 *   estudiante@eduparche.co / Student123!
 *   menor@eduparche.co   / Minor123!  (pendiente de aprobación)
 */

import 'dotenv/config'
import { PrismaClient } from '../generated/prisma'
import { PrismaPg } from '@prisma/adapter-pg'
import * as bcrypt from 'bcryptjs'

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
})

async function hash(plain: string) {
  return bcrypt.hash(plain, 10)
}

async function main() {
  console.log('🌱 Iniciando seed...\n')

  // ─── 1. USUARIOS ──────────────────────────────────────────────────────────

  const admin = await prisma.user.upsert({
    where: { email: 'admin@eduparche.co' },
    update: {},
    create: {
      email: 'admin@eduparche.co',
      passwordHash: await hash('Admin123!'),
      role: 'ADMIN',
      status: 'ACTIVE',
      totalPoints: 0,
      profile: {
        create: {
          firstName: 'Carlos',
          lastName: 'Mendoza',
          displayName: 'Admin Carlos',
          bio: 'Administrador de la plataforma EduParche.',
          city: 'Bogotá',
          documentType: 'CEDULA',
          documentNumber: '12345678',
          birthDate: new Date('1985-03-10'),
          isPublic: false,
        },
      },
    },
  })

  const tutor = await prisma.user.upsert({
    where: { email: 'tutor@eduparche.co' },
    update: {},
    create: {
      email: 'tutor@eduparche.co',
      passwordHash: await hash('Tutor123!'),
      role: 'TUTOR',
      status: 'ACTIVE',
      totalPoints: 340,
      profile: {
        create: {
          firstName: 'Valentina',
          lastName: 'Ríos',
          displayName: 'Vale Ríos',
          bio: 'Ingeniera de sistemas con 8 años de experiencia en desarrollo web y educación en programación.',
          city: 'Medellín',
          documentType: 'CEDULA',
          documentNumber: '87654321',
          birthDate: new Date('1992-07-22'),
          isPublic: true,
        },
      },
    },
  })

  const student = await prisma.user.upsert({
    where: { email: 'estudiante@eduparche.co' },
    update: {},
    create: {
      email: 'estudiante@eduparche.co',
      passwordHash: await hash('Student123!'),
      role: 'STUDENT',
      status: 'ACTIVE',
      totalPoints: 85,
      profile: {
        create: {
          firstName: 'Andrés',
          lastName: 'García',
          city: 'Cali',
          documentType: 'CEDULA',
          documentNumber: '11223344',
          birthDate: new Date('1998-05-15'),
          isPublic: true,
        },
      },
    },
  })

  // Menor pendiente de aprobación
  const minor = await prisma.user.upsert({
    where: { email: 'menor@eduparche.co' },
    update: {},
    create: {
      email: 'menor@eduparche.co',
      passwordHash: await hash('Minor123!'),
      role: 'STUDENT',
      status: 'PENDING_APPROVAL',
      totalPoints: 0,
      profile: {
        create: {
          firstName: 'Sofía',
          lastName: 'Martínez',
          city: 'Barranquilla',
          documentType: 'TARJETA_IDENTIDAD',
          documentNumber: '5566778899',
          birthDate: new Date('2010-03-20'),
          isPublic: false,
        },
      },
    },
  })

  // Solicitud de aprobación para la menor
  await prisma.minorApprovalRequest.upsert({
    where: { userId: minor.id },
    update: {},
    create: {
      userId: minor.id,
      letter: 'Yo, Paula Martínez, madre de Sofía Martínez, autorizo su participación en EduParche.',
      status: 'PENDING',
    },
  })

  console.log('✅ Usuarios creados')

  // ─── 2. CATEGORÍAS ────────────────────────────────────────────────────────

  const catProg = await prisma.courseCategory.upsert({
    where: { slug: 'programacion' },
    update: {},
    create: { name: 'Programación', slug: 'programacion' },
  })

  await prisma.courseCategory.upsert({
    where: { slug: 'idiomas' },
    update: {},
    create: { name: 'Idiomas', slug: 'idiomas' },
  })

  await prisma.courseCategory.upsert({
    where: { slug: 'habilidades-laborales' },
    update: {},
    create: { name: 'Habilidades Laborales', slug: 'habilidades-laborales' },
  })

  console.log('✅ Categorías creadas')

  // ─── 3. CURSO ─────────────────────────────────────────────────────────────

  const course = await prisma.course.upsert({
    where: { slug: 'intro-python' },
    update: {},
    create: {
      title: 'Introducción a la Programación con Python',
      slug: 'intro-python',
      description: 'Aprende los fundamentos de la programación usando Python, el lenguaje más demandado del mercado. Desde cero, sin conocimientos previos.',
      level: 'BASIC',
      status: 'ACTIVE',
      onlineHours: 20,
      autonomousHours: 10,
      categoryId: catProg.id,
      createdById: admin.id,
    },
  })

  // Asignar tutor al curso
  await prisma.tutorCourse.upsert({
    where: { tutorId_courseId: { tutorId: tutor.id, courseId: course.id } },
    update: {},
    create: { tutorId: tutor.id, courseId: course.id, assignedById: admin.id },
  })

  // Módulo 1
  const mod1 = await prisma.module.upsert({
    where: { id: 'seed-mod-1' },
    update: {},
    create: {
      id: 'seed-mod-1',
      courseId: course.id,
      title: 'Fundamentos de Python',
      description: 'Variables, tipos de datos y operaciones básicas.',
      order: 1,
      status: 'ACTIVE',
    },
  })

  const lesson1 = await prisma.lesson.upsert({
    where: { id: 'seed-les-1' },
    update: {},
    create: {
      id: 'seed-les-1',
      moduleId: mod1.id,
      title: '¿Qué es programar?',
      description: 'Introducción al pensamiento computacional y los lenguajes de programación.',
      order: 1,
      status: 'ACTIVE',
    },
  })

  await prisma.material.upsert({
    where: { id: 'seed-mat-1' },
    update: {},
    create: {
      id: 'seed-mat-1',
      lessonId: lesson1.id,
      type: 'VIDEO_LINK',
      title: 'Introducción a la programación',
      content: 'https://www.youtube.com/watch?v=_uQrJ0TkZlc',
      order: 1,
    },
  })

  const lesson2 = await prisma.lesson.upsert({
    where: { id: 'seed-les-2' },
    update: {},
    create: {
      id: 'seed-les-2',
      moduleId: mod1.id,
      title: 'Variables y tipos de datos',
      description: 'Aprende a declarar variables y los tipos primitivos de Python.',
      order: 2,
      status: 'ACTIVE',
    },
  })

  await prisma.material.upsert({
    where: { id: 'seed-mat-2' },
    update: {},
    create: {
      id: 'seed-mat-2',
      lessonId: lesson2.id,
      type: 'TEXT',
      title: 'Variables en Python',
      content: '<p>En Python no necesitas declarar el tipo de una variable. Simplemente escribe <code>nombre = "Andrés"</code> y Python detecta que es texto.</p>',
      order: 1,
    },
  })

  // Módulo 2
  const mod2 = await prisma.module.upsert({
    where: { id: 'seed-mod-2' },
    update: {},
    create: {
      id: 'seed-mod-2',
      courseId: course.id,
      title: 'Control de flujo',
      description: 'Condicionales y bucles para controlar la ejecución del programa.',
      order: 2,
      status: 'ACTIVE',
    },
  })

  await prisma.lesson.upsert({
    where: { id: 'seed-les-3' },
    update: {},
    create: {
      id: 'seed-les-3',
      moduleId: mod2.id,
      title: 'Condicionales if / elif / else',
      description: 'Toma decisiones en tu código según condiciones.',
      order: 1,
      status: 'ACTIVE',
    },
  })

  await prisma.lesson.upsert({
    where: { id: 'seed-les-4' },
    update: {},
    create: {
      id: 'seed-les-4',
      moduleId: mod2.id,
      title: 'Bucles for y while',
      description: 'Repite instrucciones automáticamente con los bucles.',
      order: 2,
      status: 'ACTIVE',
    },
  })

  console.log('✅ Curso, módulos y lecciones creados')

  // ─── 4. INSCRIPCIÓN Y PROGRESO DEL ESTUDIANTE ─────────────────────────────

  const enrollment = await prisma.enrollment.upsert({
    where: { id: 'seed-enroll-1' },
    update: {},
    create: {
      id: 'seed-enroll-1',
      studentId: student.id,
      courseId: course.id,
      status: 'ACTIVE',
    },
  })

  // Lección 1 completada
  await prisma.lessonProgress.upsert({
    where: { enrollmentId_lessonId: { enrollmentId: enrollment.id, lessonId: lesson1.id } },
    update: {},
    create: {
      studentId: student.id,
      lessonId: lesson1.id,
      enrollmentId: enrollment.id,
      status: 'COMPLETED',
      completedAt: new Date('2026-04-20T10:30:00Z'),
    },
  })

  // Lección 2 en progreso
  await prisma.lessonProgress.upsert({
    where: { enrollmentId_lessonId: { enrollmentId: enrollment.id, lessonId: lesson2.id } },
    update: {},
    create: {
      studentId: student.id,
      lessonId: lesson2.id,
      enrollmentId: enrollment.id,
      status: 'IN_PROGRESS',
    },
  })

  console.log('✅ Inscripción y progreso del estudiante creados')

  // ─── 5. GAMIFICACIÓN ──────────────────────────────────────────────────────

  const gamificationConfigs = [
    { trigger: 'LESSON_COMPLETED',   points: 10 },
    { trigger: 'MODULE_COMPLETED',   points: 50 },
    { trigger: 'COURSE_COMPLETED',   points: 200 },
    { trigger: 'CHALLENGE_COMPLETED',points: 100 },
    { trigger: 'FIRST_LOGIN',        points: 5 },
    { trigger: 'PROFILE_COMPLETED',  points: 25 },
  ] as const

  for (const config of gamificationConfigs) {
    await prisma.gamificationConfig.upsert({
      where: { trigger: config.trigger },
      update: { points: config.points },
      create: config,
    })
  }

  const badgePrimerPaso = await prisma.badge.upsert({
    where: { name: 'Primer Paso' },
    update: {},
    create: {
      name: 'Primer Paso',
      description: 'Completaste tu primera lección.',
      isActive: true,
    },
  })

  await prisma.badge.upsert({
    where: { name: 'Aprendiz' },
    update: {},
    create: {
      name: 'Aprendiz',
      description: 'Completaste tu primer módulo.',
      isActive: true,
    },
  })

  // El estudiante ganó la insignia "Primer Paso"
  await prisma.userBadge.upsert({
    where: { userId_badgeId: { userId: student.id, badgeId: badgePrimerPaso.id } },
    update: {},
    create: {
      userId: student.id,
      badgeId: badgePrimerPaso.id,
      earnedAt: new Date('2026-04-20T10:30:00Z'),
    },
  })

  // Transacciones de puntos del estudiante
  const transactions = [
    { trigger: 'FIRST_LOGIN',       points: 5,  referenceId: null },
    { trigger: 'LESSON_COMPLETED',  points: 10, referenceId: lesson1.id },
    { trigger: 'PROFILE_COMPLETED', points: 25, referenceId: null },
  ] as const

  for (const tx of transactions) {
    await prisma.pointTransaction.create({
      data: { userId: student.id, ...tx },
    }).catch(() => {}) // silencia duplicados en re-seeds parciales
  }

  console.log('✅ Gamificación, badges y puntos creados')

  // ─── Resumen ──────────────────────────────────────────────────────────────

  console.log(`
╔══════════════════════════════════════════════════════╗
║              Seed completado exitosamente            ║
╠══════════════════════════════════════════════════════╣
║  ADMIN    admin@eduparche.co     / Admin123!         ║
║  TUTOR    tutor@eduparche.co     / Tutor123!         ║
║  STUDENT  estudiante@eduparche.co/ Student123!       ║
║  MINOR    menor@eduparche.co     / Minor123!         ║
║           (pendiente de aprobación)                  ║
╠══════════════════════════════════════════════════════╣
║  Curso: Introducción a Python (4 lecciones)          ║
║  Estudiante: 1 lección completada, 1 en progreso     ║
╚══════════════════════════════════════════════════════╝
  `)
}

main()
  .catch((e) => { console.error('❌ Error en seed:', e); process.exit(1) })
  .finally(() => prisma.$disconnect())
