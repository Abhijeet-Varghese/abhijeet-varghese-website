<?php
declare(strict_types=1);
namespace AvOS\Content\Events;

/**
 * In-process synchronous event dispatcher (Phase 3E §3E.9).
 *
 * There is no queue yet, and this does not pretend there is one. Listeners run
 * inline, in registration order, inside the caller's request. A listener that
 * throws is caught and logged rather than being allowed to fail a publish that
 * has already committed — the alternative is a half-published page.
 *
 * When Phase 3P lands, a QueueingListener registers here and the rest of the
 * content engine does not change.
 */
final class EventDispatcher
{
    /** @var array<string,array<int,callable>> */
    private array $listeners = [];
    /** @var array<int,callable> */
    private array $wildcard = [];
    /** @var ContentEvent[] events dispatched during this request, for tests/diagnostics */
    private array $dispatched = [];

    public function on(string $eventName, callable $listener): void
    { $this->listeners[$eventName][] = $listener; }

    public function onAny(callable $listener): void
    { $this->wildcard[] = $listener; }

    public function dispatch(ContentEvent $event): void
    {
        $this->dispatched[] = $event;
        foreach ([...($this->listeners[$event->name] ?? []), ...$this->wildcard] as $listener) {
            try {
                $listener($event);
            } catch (\Throwable $e) {
                error_log(sprintf(
                    '[AVOS][%s] content listener failed for %s: %s',
                    $event->requestId, $event->name, $e->getMessage(),
                ));
            }
        }
    }

    /** @return ContentEvent[] */
    public function dispatched(): array { return $this->dispatched; }

    public function reset(): void { $this->dispatched = []; }
}
