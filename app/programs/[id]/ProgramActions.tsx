'use client'

import { useState, useTransition } from 'react'
import { enroll, withdraw } from './actions'

type TeacherInfo = {
  full_name: string | null
  phone_number: string | null
  email: string | null
  image_url: string | null
}

export default function ProgramActions({
  programId,
  isEnrolled,
  price,
  teacher,
}: {
  programId: string
  isEnrolled: boolean
  price: number | null
  teacher: TeacherInfo
}) {
  const [openEnroll, setOpenEnroll] = useState(false)
  const [openContact, setOpenContact] = useState(false)
  const [doneMsg, setDoneMsg] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  const buttonLabel = isEnrolled ? 'Withdraw' : 'Register'

  async function onConfirmEnroll() {
    startTransition(async () => {
      try {
        if (isEnrolled) await withdraw(programId)
        else await enroll(programId)

        setDoneMsg(isEnrolled ? 'You have withdrawn successfully.' : 'You are now enrolled!')
      } catch (e: any) {
        setDoneMsg(e?.message ?? 'Something went wrong.')
      }
    })
  }

  return (
    <>
      <div className="grid gap-4">
        <div className="text-sm text-gray-700">
          <div className="text-base font-semibold text-gray-900">Price per month</div>
          <div className="mt-1 text-3xl font-extrabold">
            {price == null ? '—' : `$${price}`}
          </div>
        </div>

        <button
          type="button"
          className={
            isEnrolled
              ? 'rounded-full bg-red-700 px-5 py-3 text-sm font-semibold text-white hover:brightness-110 disabled:opacity-60'
              : 'rounded-full bg-green-600 px-5 py-3 text-sm font-semibold text-white hover:brightness-110 disabled:opacity-60'
          }
          disabled={isPending}
          onClick={() => {
            setDoneMsg(null)
            setOpenEnroll(true)
          }}
        >
          {buttonLabel}
        </button>

        <button
          type="button"
          className="rounded-full border px-5 py-3 text-sm font-semibold hover:bg-gray-50"
          onClick={() => setOpenContact(true)}
        >
          Contact teacher
        </button>
      </div>

      {/* Register/Withdraw modal */}
      {openEnroll && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="text-lg font-semibold">{buttonLabel}</div>
                <div className="mt-1 text-sm text-gray-600">
                  {isEnrolled
                    ? 'Are you sure you want to withdraw from this program?'
                    : 'Are you sure you want to register for this program?'}
                </div>
              </div>

              <button
                type="button"
                className="rounded-lg px-2 py-1 text-gray-500 hover:bg-gray-100"
                onClick={() => setOpenEnroll(false)}
                aria-label="Close"
              >
                ✕
              </button>
            </div>

            {doneMsg ? (
              <div className="mt-4 rounded-xl border bg-gray-50 p-4 text-sm">{doneMsg}</div>
            ) : (
              <div className="mt-6 flex items-center justify-end gap-2">
                <button
                  type="button"
                  className="rounded-xl border px-4 py-2 text-sm font-medium hover:bg-gray-50"
                  onClick={() => setOpenEnroll(false)}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="rounded-xl bg-gray-900 px-4 py-2 text-sm font-semibold text-white hover:bg-black disabled:opacity-60"
                  disabled={isPending}
                  onClick={onConfirmEnroll}
                >
                  Confirm
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Contact Teacher modal */}
      {openContact && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="text-lg font-semibold">Contact teacher</div>
                <div className="mt-1 text-sm text-gray-600">Reach out for questions about this program.</div>
              </div>

              <button
                type="button"
                className="rounded-lg px-2 py-1 text-gray-500 hover:bg-gray-100"
                onClick={() => setOpenContact(false)}
                aria-label="Close"
              >
                ✕
              </button>
            </div>

            <div className="mt-5 flex items-center gap-4">
              <div className="h-14 w-14 overflow-hidden rounded-full border bg-gray-100">
                {teacher.image_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={teacher.image_url} alt="Teacher avatar" className="h-full w-full object-cover" />
                ) : null}
              </div>

              <div className="min-w-0">
                <div className="font-semibold">{teacher.full_name ?? 'Teacher'}</div>
                <div className="text-sm text-gray-600">{teacher.email ?? 'Email not available'}</div>
                <div className="text-sm text-gray-600">{teacher.phone_number ?? 'Phone not available'}</div>
              </div>
            </div>

            <div className="mt-6 flex items-center justify-end">
              <button
                type="button"
                className="rounded-xl border px-4 py-2 text-sm font-medium hover:bg-gray-50"
                onClick={() => setOpenContact(false)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
