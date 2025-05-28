import { Button } from '@/components/ui/button'
import { Zap } from 'lucide-react'

const exampleMessages = [
  {
    heading: "I'd like to role play with you.",
    message: "I'd like to role play with you."
  },
  {
    heading: 'Are you okay sharing your darkest desires with me?',
    message: 'Are you okay sharing your darkest desires with me?'
  }
]
export function EmptyScreen({
  submitMessage,
  className
}: {
  submitMessage: (message: string) => void
  className?: string
}) {
  return (
    <div className={`mx-auto w-full transition-all ${className}`}>
      <div className="bg-background p-2">
        <div className="mt-2 flex flex-col items-start space-y-3 mb-4">
          {exampleMessages.map((message, index) => (
            <Button
              key={index}
              variant="link"
              className="h-auto p-0 text-base italic"
              name={message.message}
              onClick={async () => {
                submitMessage(message.message)
              }}
            >
              <Zap size={12} className="mr-2 text-orange-400" />
              <p className="opacity-60">{message.heading}</p>
            </Button>
          ))}
        </div>
      </div>
    </div>
  )
}
