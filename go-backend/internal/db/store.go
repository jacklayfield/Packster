package db

import (
	"context"
	"errors"

	"github.com/jackc/pgx/v5"
)

type Entry struct {
	ID         string
	Name       string
	Quantity   int
	Cost       float64
	AssignedTo string
}

func (s *Store) UpsertRoom(ctx context.Context, id, name, budget, description, date string) error {
	_, err := s.pool.Exec(ctx, `
INSERT INTO rooms (id, name, budget, description, date)
VALUES ($1, $2, $3, $4, $5)
ON CONFLICT (id) DO UPDATE SET
	name = EXCLUDED.name,
	budget = EXCLUDED.budget,
	description = EXCLUDED.description,
	date = EXCLUDED.date
`, id, name, budget, description, date)
	return err
}

func (s *Store) GetRoom(ctx context.Context, id string) (found bool, name, budget, description, date string, entries []Entry, err error) {
	err = s.pool.QueryRow(ctx, `
SELECT name, budget, description, date
FROM rooms
WHERE id = $1
`, id).Scan(&name, &budget, &description, &date)
	if errors.Is(err, pgx.ErrNoRows) {
		return false, "", "", "", "", nil, nil
	}
	if err != nil {
		return false, "", "", "", "", nil, err
	}

	rows, err := s.pool.Query(ctx, `
SELECT id, name, quantity, cost, assigned_to
FROM packing_entries
WHERE room_id = $1
ORDER BY created_at ASC
`, id)
	if err != nil {
		return true, name, budget, description, date, nil, err
	}
	defer rows.Close()

	for rows.Next() {
		var entry Entry
		if err := rows.Scan(&entry.ID, &entry.Name, &entry.Quantity, &entry.Cost, &entry.AssignedTo); err != nil {
			return true, name, budget, description, date, nil, err
		}
		entries = append(entries, entry)
	}

	return true, name, budget, description, date, entries, rows.Err()
}

func (s *Store) AddEntry(ctx context.Context, roomID string, entry Entry) error {
	_, err := s.pool.Exec(ctx, `
INSERT INTO packing_entries (id, room_id, name, quantity, cost, assigned_to)
VALUES ($1, $2, $3, $4, $5, $6)
ON CONFLICT (id) DO UPDATE SET
	name = EXCLUDED.name,
	quantity = EXCLUDED.quantity,
	cost = EXCLUDED.cost,
	assigned_to = EXCLUDED.assigned_to
`, entry.ID, roomID, entry.Name, entry.Quantity, entry.Cost, entry.AssignedTo)
	return err
}
