import "@material/mwc-button";
import "@polymer/paper-input/paper-input";
import { HassEvent } from "home-assistant-js-websocket";
import {
  css,
  CSSResult,
  customElement,
  html,
  internalProperty,
  LitElement,
  property,
  TemplateResult,
} from "lit-element";
import { formatTime } from "../../../common/datetime/format_time";
import "../../../components/ha-card";
import { PolymerChangedEvent } from "../../../polymer-types";
import { HomeAssistant } from "../../../types";

@customElement("event-subscribe-card")
class EventSubscribeCard extends LitElement {
  @property({ attribute: false }) public hass?: HomeAssistant;

  @internalProperty() private _eventType = "";

  @internalProperty() private _subscribed?: () => void;

  @internalProperty() private _events: Array<{
    id: number;
    event: HassEvent;
  }> = [];

  private _eventCount = 0;

  public disconnectedCallback() {
    super.disconnectedCallback();
    if (this._subscribed) {
      this._subscribed();
      this._subscribed = undefined;
    }
  }

  protected render(): TemplateResult {
    return html`
      <ha-card
        header=${this.hass!.localize(
          "ui.panel.developer-tools.tabs.events.listen_to_events"
        )}
      >
        <form>
          <paper-input
            .label=${this._subscribed
              ? this.hass!.localize(
                  "ui.panel.developer-tools.tabs.events.listening_to"
                )
              : this.hass!.localize(
                  "ui.panel.developer-tools.tabs.events.subscribe_to"
                )}
            .disabled=${this._subscribed !== undefined}
            .value=${this._eventType}
            @value-changed=${this._valueChanged}
          ></paper-input>
          <mwc-button
            .disabled=${this._eventType === ""}
            @click=${this._handleSubmit}
            type="submit"
          >
            ${this._subscribed
              ? this.hass!.localize(
                  "ui.panel.developer-tools.tabs.events.stop_listening"
                )
              : this.hass!.localize(
                  "ui.panel.developer-tools.tabs.events.start_listening"
                )}
          </mwc-button>
        </form>
        <div class="events">
          ${this._events.map(
            (ev) => html`
              <div class="event">
                ${this.hass!.localize(
                  "ui.panel.developer-tools.tabs.events.event_fired",
                  "name",
                  ev.id
                )}
                ${formatTime(new Date(ev.event.time_fired), this.hass!.locale)}:
                <pre>${JSON.stringify(ev.event, null, 4)}</pre>
              </div>
            `
          )}
        </div>
      </ha-card>
    `;
  }

  private _valueChanged(ev: PolymerChangedEvent<string>): void {
    this._eventType = ev.detail.value;
  }

  private async _handleSubmit(): Promise<void> {
    if (this._subscribed) {
      this._subscribed();
      this._subscribed = undefined;
    } else {
      this._subscribed = await this.hass!.connection.subscribeEvents<HassEvent>(
        (event) => {
          const tail =
            this._events.length > 30 ? this._events.slice(0, 29) : this._events;
          this._events = [
            {
              event,
              id: this._eventCount++,
            },
            ...tail,
          ];
        },
        this._eventType
      );
    }
  }

  static get styles(): CSSResult {
    return css`
      form {
        display: block;
        padding: 0 0 16px 16px;
      }
      paper-input {
        display: inline-block;
        width: 200px;
      }
      mwc-button {
        vertical-align: middle;
      }
      .events {
        margin: -16px 0;
        padding: 0 16px;
      }
      .event {
        border-top: 1px solid var(--divider-color);
        padding-top: 8px;
        padding-bottom: 8px;
        margin: 16px 0;
      }
      .event:last-child {
        border-bottom: 0;
      }
      pre {
        font-family: var(--code-font-family, monospace);
      }
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "event-subscribe-card": EventSubscribeCard;
  }
}
