import "./App.css"
import { useForm, SubmitHandler } from "react-hook-form"
import ErrorMessage from "./components/form/ErrorMessage"
import { Authenticator } from "@aws-amplify/ui-react"
import ReactMarkdown from "react-markdown"
import { fetchAuthSession } from "aws-amplify/auth"
import { LambdaClient, InvokeCommand } from "@aws-sdk/client-lambda"
import { fromCognitoIdentityPool } from "@aws-sdk/credential-provider-cognito-identity"

import "./auth/amplify.ts"
import "@aws-amplify/ui-react/styles.css"
import { useState } from "react"

type FormValues = {
  client: string
  country: string
  serviceDescription: string
  awsServiceToImplement: string
  currentMethod: string
  newSystemMethod: string
  successCriteria: string
}

function App() {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>()

  const [responsePrompt, setResponsePrompt] = useState("")

  const onSubmit: SubmitHandler<FormValues> = async (data) => {
    try {
      const session = await fetchAuthSession()
      const idToken = session?.tokens?.idToken

      if (idToken) {
        const lambdaClient = new LambdaClient({
          region: "us-east-1",
          credentials: fromCognitoIdentityPool({
            clientConfig: { region: "us-east-1" },
            identityPoolId: import.meta.env
              .VITE_COGNITO_IDENTITY_POOL_ID as string,
            logins: {
              [`cognito-idp.${import.meta.env.VITE_AWS_REGION}.amazonaws.com/${
                import.meta.env.VITE_COGNITO_USER_POOL_ID
              }`]: idToken.toString(),
            },
          }),
        })

        const params = {
          FunctionName: "myLambdaFunction",
          Payload: JSON.stringify({
            prompt: "PROMPT#123",
            parameters: {
              client: data.client,
              country: data.country,
              serviceDescription: data.serviceDescription,
              awsServiceToImplement: data.awsServiceToImplement,
              currentMethod: data.currentMethod,
              newSystemMethod: data.newSystemMethod,
              successCriteria: data.successCriteria,
            },
          }),
        }

        const command = new InvokeCommand(params)
        const response = await lambdaClient.send(command)

        const responsePayload = JSON.parse(
          new TextDecoder().decode(response.Payload)
        )

        setResponsePrompt(responsePayload.body)
      }
    } catch (error) {
      console.error("Error de autenticación o invocación de Lambda:", error)
    }
  }

  return (
    <Authenticator>
      <div className="layout-container">
        <form onSubmit={handleSubmit(onSubmit)} className="form-body">
          <h1>Prompt para servicio</h1>
          <div className="form-field-container">
            <label className="form-label">¿Quién es el cliente?</label>
            <input
              className="form-input-text"
              type="text"
              {...register("client", { required: "Este campo es obligatorio" })}
            />
            <ErrorMessage message={errors.client?.message} />
          </div>

          <div className="form-field-container">
            <label className="form-label">¿Qué país es?</label>
            <input
              className="form-input-text"
              {...register("country", {
                required: "Este campo es obligatorio",
              })}
            />
            <ErrorMessage message={errors.country?.message} />
          </div>

          <div className="form-field-container full-columns">
            <label className="form-label">Descripción del servicio</label>
            <textarea
              className="form-input-textarea"
              {...register("serviceDescription", {
                required: "Este campo es obligatorio",
              })}
            />
            <ErrorMessage message={errors.serviceDescription?.message} />
          </div>

          <div className="form-field-container full-columns">
            <label className="form-label">AWS Service a implementar</label>
            <textarea
              className="form-input-textarea"
              {...register("awsServiceToImplement", {
                required: "Este campo es obligatorio",
              })}
            />
            <ErrorMessage message={errors.awsServiceToImplement?.message} />
          </div>

          <section className="conditions full-columns">
            <div className="form-field-container">
              <label className="form-label">
                ¿Cómo lo hace el cliente actualmente?
              </label>
              <textarea
                className="form-input-textarea"
                {...register("currentMethod", {
                  required: "Este campo es obligatorio",
                })}
              />
              <ErrorMessage message={errors.currentMethod?.message} />
            </div>

            <div className="form-field-container">
              <label className="form-label">
                ¿Cómo lo haría con el nuevo sistema?
              </label>
              <textarea
                className="form-input-textarea"
                {...register("newSystemMethod", {
                  required: "Este campo es obligatorio",
                })}
              />
              <ErrorMessage message={errors.newSystemMethod?.message} />
            </div>

            <div className="form-field-container">
              <label className="form-label">
                ¿Cuál es el criterio de éxito?
              </label>
              <textarea
                className="form-input-textarea"
                {...register("successCriteria", {
                  required: "Este campo es obligatorio",
                })}
              />
              <ErrorMessage message={errors.successCriteria?.message} />
            </div>
          </section>

          <input className="button" type="submit" value="Enviar" />
        </form>

        <div className="response-prompt">
          {responsePrompt.length > 0 && (
            <ReactMarkdown>{responsePrompt}</ReactMarkdown>
          )}
        </div>
      </div>
    </Authenticator>
  )
}

export default App
