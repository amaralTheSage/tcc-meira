<?php

namespace App\Services\ProjectUndo;

class ProjectUndoResult
{
    private function __construct(
        public bool $undone,
        public string $message,
        public bool $conflict = false,
    ) {}

    public static function undone(string $label): self
    {
        return new self(true, "Undid {$label}.");
    }

    public static function empty(): self
    {
        return new self(false, 'Nothing to undo.');
    }

    public static function conflict(string $message): self
    {
        return new self(false, $message, true);
    }
}
