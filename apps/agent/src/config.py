from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    llm_model: str = "gpt-5.4-mini"
    agent_port: int = 8123

    model_config = SettingsConfigDict(env_file=".env", extra="ignore")


settings = Settings()
